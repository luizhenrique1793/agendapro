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
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const data = payload.data || payload;
    
    // Ignore status or own messages
    if (data.key?.fromMe || !data.message) {
      return new Response(JSON.stringify({ status: 'ignored' }), { headers: corsHeaders });
    }

    const senderPhone = data.key.remoteJid; 
    const incomingText = data.message.conversation || data.message.extendedTextMessage?.text;
    const instanceName = payload.instance || data.instance;

    if (!incomingText) {
      return new Response(JSON.stringify({ status: 'no_text' }), { headers: corsHeaders });
    }

    // Initialize Supabase Admin client with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Identify Business
    const { data: businesses, error: bError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, description, slug, assistant_config, evolution_api_config, services(name, price)')
      .contains('evolution_api_config', { instanceName: instanceName })
      .limit(1);

    if (bError || !businesses || businesses.length === 0) {
      console.error("Business not found for instance:", instanceName);
      return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404 });
    }

    const business = businesses[0];
    const config = business.assistant_config as AssistantConfig;
    const apiConfig = business.evolution_api_config;

    if (!config?.active) {
      return new Response(JSON.stringify({ status: 'agent_disabled' }));
    }

    // 2. Save user message to history
    await supabaseAdmin.from('chat_history').insert({
      business_id: business.id,
      contact_phone: senderPhone,
      role: 'user',
      content: incomingText
    });

    // 3. Fetch history for context (last 10)
    const { data: history } = await supabaseAdmin
      .from('chat_history')
      .select('role, content')
      .eq('business_id', business.id)
      .eq('contact_phone', senderPhone)
      .order('created_at', { ascending: false })
      .limit(10);

    // Convert to Gemini format
    const rawHistory = (history || []).reverse().map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // SANITIZATION: Gemini rejects messages with the same role consecutively (e.g., user, user).
    // We'll group consecutive messages from the same author.
    const chatHistory: any[] = [];
    if (rawHistory.length > 0) {
        let currentMsg = rawHistory[0];
        
        for (let i = 1; i < rawHistory.length; i++) {
            const nextMsg = rawHistory[i];
            if (nextMsg.role === currentMsg.role) {
                // Same role: concatenate the text
                currentMsg.parts[0].text += "\n" + nextMsg.parts[0].text;
            } else {
                // Different role: push the previous and start new
                chatHistory.push(currentMsg);
                currentMsg = nextMsg;
            }
        }
        chatHistory.push(currentMsg);
    }

    // If by chance the last message is not from user (e.g., previous error), AI should not respond model->model
    // But in our flow, we just saved the user msg, so the last should be user.

    // 4. System Prompt
    const servicesList = business.services?.map((s: any) => `- ${s.name} (R$ ${s.price})`).join('\n');
    const bookingLink = `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://agendapro.com'}/#/book/${business.slug}`;

    const systemPrompt = `
      ACT AS: ${config.identity.name}, virtual assistant of ${business.name}.
      
      YOUR PERSONALITY:
      - Tone of voice: ${config.identity.tone}.
      - Description: ${config.identity.description}.
      ${config.behavior.persuasive_mode ? '- PERSUASIVE MODE ACTIVE.' : ''}

      CONTEXT:
      - Services:
      ${servicesList}
      - Booking link: ${bookingLink}

      IMPORTANT RULES:
      - Respond in a short and direct way (WhatsApp style).
      - NEVER invent time slots. If asked about availability, send the link.
      - Use the default messages configured if it makes sense.
      - Link to book: ${bookingLink}
    `;

    // 5. Determine API Key
    const apiKey = config.gemini_key || Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      console.error("No Gemini API Key configured.");
      return new Response(JSON.stringify({ error: 'No API Key' }), { status: 500 });
    }

    // 6. Call AI
    // We use system_instruction to separate context from chat, avoiding role confusion
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

    // Handle AI Error
    if (aiData.error) {
        console.error("Gemini API Error:", JSON.stringify(aiData.error));
        // We don't respond to the user with the technical error, but log it for debugging
        return new Response(JSON.stringify({ error: aiData.error.message }), { status: 200 });
    }

    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
        console.error("Empty AI response:", JSON.stringify(aiData));
        return new Response(JSON.stringify({ error: 'Empty AI response' }), { status: 200 });
    }

    // 7. Save response
    await supabaseAdmin.from('chat_history').insert({
      business_id: business.id,
      contact_phone: senderPhone,
      role: 'model',
      content: replyText
    });

    // 8. Send via Evolution API
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