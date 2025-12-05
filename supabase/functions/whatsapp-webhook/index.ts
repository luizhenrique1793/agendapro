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
    
    // Validação básica do Payload Evolution API
    const data = payload.data || payload;
    
    // Ignorar mensagens próprias ou status
    if (data.key?.fromMe || !data.message) {
      return new Response(JSON.stringify({ status: 'ignored' }), { headers: corsHeaders });
    }

    const senderPhone = data.key.remoteJid; // Ex: 5511999999999@s.whatsapp.net
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

    // 3. Buscar histórico recente (Memória)
    // Pegamos as últimas 10 mensagens para contexto
    const { data: history } = await supabaseAdmin
      .from('chat_history')
      .select('role, content')
      .eq('business_id', business.id)
      .eq('contact_phone', senderPhone)
      .order('created_at', { ascending: false })
      .limit(10);

    // Reverter para ordem cronológica (mais antigo -> mais novo)
    const chatHistory = (history || []).reverse().map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 4. Construir Prompt do Sistema
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

      REGRAS:
      - Responda de forma curta (WhatsApp style).
      - SEMPRE envie o link ${bookingLink} para agendamentos.
      - Use as mensagens padrão configuradas se apropriado.
    `;

    // 5. Determinar API Key (Negócio > Global)
    const apiKey = config.gemini_key || Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      console.error("Nenhuma chave Gemini configurada.");
      return new Response(JSON.stringify({ error: 'No API Key' }), { status: 500 });
    }

    // 6. Chamar IA
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] }, // System instruction hack for Gemini Rest API
          ...chatHistory // Inclui a mensagem atual do usuário que já foi salva no passo 2
        ]
      })
    });

    const aiData = await aiResponse.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não entendi. Pode repetir?";

    // 7. Salvar resposta da IA no histórico
    await supabaseAdmin.from('chat_history').insert({
      business_id: business.id,
      contact_phone: senderPhone,
      role: 'model',
      content: replyText
    });

    // 8. Enviar via Evolution API
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