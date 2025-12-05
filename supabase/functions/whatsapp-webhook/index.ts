import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssistantConfig {
  active: boolean;
  gemini_key?: string;
  identity: { name: string; tone: string; description: string };
  behavior: { ask_if_new_client: boolean; persuasive_mode: boolean };
  messages: any;
  persuasion: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    const data = payload.data || payload;
    
    // Ignorar status ou mensagens próprias
    if (data.key?.fromMe || !data.message) {
      return new Response(JSON.stringify({ status: 'ignored' }), { headers: corsHeaders });
    }

    const senderPhone = data.key.remoteJid; 
    const incomingText = data.message.conversation || data.message.extendedTextMessage?.text;
    const instanceName = payload.instance || data.instance;

    if (!incomingText) {
      return new Response(JSON.stringify({ status: 'no_text' }), { headers: corsHeaders });
    }

    // Inicializar Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Identificar Negócio
    const { data: businesses, error: bError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, description, slug, assistant_config, evolution_api_config, services(name, price)')
      .contains('evolution_api_config', { instanceName: instanceName })
      .limit(1);

    if (bError || !businesses || businesses.length === 0) {
      console.error("Negócio não encontrado para instância:", instanceName);
      return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404 });
    }

    const business = businesses[0];
    const config = business.assistant_config as AssistantConfig;
    const apiConfig = business.evolution_api_config;

    if (!config?.active) {
      return new Response(JSON.stringify({ status: 'agent_disabled' }));
    }

    // 2. Salvar mensagem do usuário no histórico
    await supabaseAdmin.from('chat_history').insert({
      business_id: business.id,
      contact_phone: senderPhone,
      role: 'user',
      content: incomingText
    });

    // 3. Buscar histórico para contexto (últimas 10)
    const { data: history } = await supabaseAdmin
      .from('chat_history')
      .select('role, content')
      .eq('business_id', business.id)
      .eq('contact_phone', senderPhone)
      .order('created_at', { ascending: false })
      .limit(10);

    // Converter para formato Gemini
    const rawHistory = (history || []).reverse().map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // SANITIZAÇÃO: O Gemini rejeita mensagens com o mesmo role consecutivas (ex: user, user).
    // Vamos agrupar mensagens consecutivas do mesmo autor.
    const chatHistory: any[] = [];
    if (rawHistory.length > 0) {
        let currentMsg = rawHistory[0];
        
        for (let i = 1; i < rawHistory.length; i++) {
            const nextMsg = rawHistory[i];
            if (nextMsg.role === currentMsg.role) {
                // Mesma role: concatena o texto
                currentMsg.parts[0].text += "\n" + nextMsg.parts[0].text;
            } else {
                // Role diferente: empurra a anterior e inicia nova
                chatHistory.push(currentMsg);
                currentMsg = nextMsg;
            }
        }
        chatHistory.push(currentMsg);
    }

    // Se por acaso a última mensagem não for do usuário (ex: erro anterior), a IA não deve responder modelo->modelo
    // Mas no nosso fluxo, acabamos de salvar a msg do user, então a última deve ser user.

    // 4. Prompt do Sistema
    const servicesList = business.services?.map((s: any) => `- ${s.name} (R$ ${s.price})`).join('\n');
    const bookingLink = `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://agendapro.com'}/#/book/${business.slug}`;

    const systemPrompt = `
      ATUE COMO: ${config.identity.name}, assistente virtual da ${business.name}.
      
      SUA PERSONALIDADE:
      - Tom de voz: ${config.identity.tone}.
      - Descrição: ${config.identity.description}.
      ${config.behavior.persuasive_mode ? '- MODO PERSUASIVO ATIVO.' : ''}

      CONTEXTO:
      - Serviços:
      ${servicesList}
      - Link de agendamento: ${bookingLink}

      REGRAS IMPORTANTES:
      - Responda de forma curta e direta (estilo WhatsApp).
      - NUNCA invente horários. Se perguntarem disponibilidade, mande o link.
      - Use as mensagens padrão configuradas se fizer sentido.
      - Link para agendar: ${bookingLink}
    `;

    // 5. Determinar API Key
    const apiKey = config.gemini_key || Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      console.error("Sem API Key do Gemini configurada.");
      return new Response(JSON.stringify({ error: 'No API Key' }), { status: 500 });
    }

    // 6. Chamar IA
    // Usamos system_instruction para separar o contexto do chat, evitando confusão de roles
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: chatHistory
      })
    });

    const aiData = await aiResponse.json();

    // Tratamento de Erro da IA
    if (aiData.error) {
        console.error("Gemini API Error:", JSON.stringify(aiData.error));
        // Não respondemos ao usuário o erro técnico, mas logamos para debug
        return new Response(JSON.stringify({ error: aiData.error.message }), { status: 200 });
    }

    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
        console.error("Resposta vazia da IA:", JSON.stringify(aiData));
        return new Response(JSON.stringify({ error: 'Empty AI response' }), { status: 200 });
    }

    // 7. Salvar resposta
    await supabaseAdmin.from('chat_history').insert({
      business_id: business.id,
      contact_phone: senderPhone,
      role: 'model',
      content: replyText
    });

    // 8. Enviar via Evolution API
    if (apiConfig && apiConfig.serverUrl && apiConfig.apiKey) {
        const normalizedUrl = apiConfig.serverUrl.replace(/\/$/, "");
        const sendEndpoint = `${normalizedUrl}/message/sendText/${apiConfig.instanceName}`;
        const cleanPhone = senderPhone.replace('@s.whatsapp.net', '');

        await fetch(sendEndpoint, {
            method: 'POST',
            headers: { 
                'apikey': apiConfig.apiKey, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                number: cleanPhone,
                text: replyText,
                options: { delay: 1500, presence: "composing" }
            })
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});