import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { serverUrl, apiKey, instanceName, to, message } = await req.json();

    if (!serverUrl || !apiKey || !instanceName || !to || !message) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Normaliza a URL
    const normalizedUrl = serverUrl.replace(/\/$/, "");
    const endpoint = `${normalizedUrl}/message/sendText/${instanceName}`;

    console.log(`Sending message to ${to} via ${endpoint}`);

    // Limpa o número (remove caracteres não numéricos)
    const cleanPhone = to.replace(/\D/g, "");

    // Ajuste no payload conforme erro "instance requires property 'text'"
    // Algumas versões da API esperam "text" na raiz, outras dentro de "textMessage".
    // Vamos usar o formato simplificado que o erro sugere.
    const payload = {
      number: cleanPhone,
      text: message,
      options: {
        delay: 1000,
        presence: "composing",
        linkPreview: false
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Erro na Evolution API (${response.status}): ${errorText}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});