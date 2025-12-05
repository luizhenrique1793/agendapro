import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuração de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para tipar a configuração vinda do banco
interface AssistantConfig {
  active: boolean;
  identity: { name: string; tone: string; description: string };
  behavior: { ask_if_new_client: boolean; persuasive_mode: boolean };
  messages: any;
  persuasion: any;
}

serve(async (req) => {
  // 1. Tratamento de CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    
    // 2. Validação básica do Payload da Evolution API (v1 ou v2)
    // Ajuste conforme a versão da sua Evolution API. Este exemplo foca no evento messages.upsert
    const data = payload.data || payload;
    const messageType = data.messageType || data.type;
    
    // Ignorar mensagens enviadas por mim mesmo (fromMe) ou mensagens de status
    if (data.key?.fromMe || !data.message) {
      return new Response(JSON.stringify({ status: 'ignored' }), { headers: corsHeaders });
    }

    // Extrair dados cruciais
    const senderPhone = data.key.remoteJid; // Ex: 5511999999999@s.whatsapp.net
    const incomingText = data.message.conversation || data.message.extendedTextMessage?.text;
    const instanceName = payload.instance || data.instance; // Nome da instância para identificar o negócio

    if (!incomingText) {
      return new Response(JSON.stringify({ status: 'no_text' }), { headers: corsHeaders });
    }

    console.log(`📩 Mensagem recebida de ${senderPhone} na instância ${instanceName}: ${incomingText}`);

    // 3. Inicializar Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 4. Identificar o Negócio e carregar configurações
    // Buscamos o negócio que tenha essa instância configurada no JSONB evolution_api_config
    const { data: businesses, error: bError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, description, slug, assistant_config, evolution_api_config, services(name, price)')
      .contains('evolution_api_config', { instanceName: instanceName })
      .limit(1);

    if (bError || !businesses || businesses.length === 0) {
      console.error('Negócio não encontrado para a instância:', instanceName);
      return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404 });
    }

    const business = businesses[0];
    const config = business.assistant_config as AssistantConfig;
    const apiConfig = business.evolution_api_config;

    // Verificar se o agente está ativo
    if (!config?.active) {
      console.log('Agente desativado para este negócio.');
      return new Response(JSON.stringify({ status: 'agent_disabled' }));
    }

    // 5. Construção do Prompt do Sistema (A "Alma" do Agente)
    const servicesList = business.services?.map((s: any) => `- ${s.name} (R$ ${s.price})`).join('\n');
    const bookingLink = `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://agendapro.com'}/#/book/${business.slug}`;

    const systemPrompt = `
      ATUE COMO: ${config.identity.name}, assistente virtual da ${business.name}.
      
      SUA PERSONALIDADE:
      - Tom de voz: ${config.identity.tone}.
      - Descrição: ${config.identity.description}.
      ${config.behavior.persuasive_mode ? '- MODO PERSUASIVO ATIVO: Use gatilhos mentais e foque nos benefícios.' : ''}

      CONTEXTO DO NEGÓCIO:
      - Nome: ${business.name}
      - Descrição: ${business.description}
      - Serviços:
      ${servicesList}

      SEUS OBJETIVOS:
      1. Responder dúvidas sobre serviços e horários.
      2. Direcionar o cliente para agendar no link oficial: ${bookingLink}
      3. ${config.behavior.ask_if_new_client ? 'Se for o início da conversa, pergunte gentilmente se é a primeira vez do cliente conosco.' : ''}

      MENSAGENS PADRÃO (Use como base, mas adapte para o contexto):
      - Boas-vindas (Novo): "${config.messages.welcome_new}"
      - Boas-vindas (Recorrente): "${config.messages.welcome_existing}"
      - Sem horários: "${config.messages.no_slots}"

      REGRAS:
      - Responda de forma curta e natural (estilo WhatsApp).
      - NUNCA invente horários que não sabe.
      - Sempre envie o link ${bookingLink} quando o cliente quiser agendar.
    `;

    // 6. Chamar a IA (Exemplo com Gemini via REST, pois é gratuito/barato e fácil)
    // OBS: Você precisa configurar GEMINI_API_KEY nos Secrets do Supabase
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] }, // Contexto (System Hack para Gemini)
          { role: "model", parts: [{ text: "Entendido. Estou pronto para atuar como o assistente." }] },
          { role: "user", parts: [{ text: incomingText }] } // Mensagem do cliente
        ]
      })
    });

    const aiData = await aiResponse.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, estou com uma instabilidade momentânea. Pode tentar novamente?";

    // 7. Enviar resposta via Evolution API
    const normalizedUrl = apiConfig.serverUrl.replace(/\/$/, "");
    const sendEndpoint = `${normalizedUrl}/message/sendText/${apiConfig.instanceName}`;
    
    // Limpeza do número
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
        options: { delay: 2000, presence: "composing" }
      })
    });

    return new Response(JSON.stringify({ success: true, reply: replyText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error("Erro no webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});