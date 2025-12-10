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
    const { serverUrl, apiKey, instanceName } = await req.json();

    if (!serverUrl || !apiKey || !instanceName) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Normaliza a URL (remove barra no final se existir)
    const normalizedUrl = serverUrl.replace(/\/$/, "");
    const endpoint = `${normalizedUrl}/instance/connectionState/${instanceName}`;

    console.log(`Checking connection: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Se a API retornar 404, a instância não existe. 
      // Se retornar 403, a chave está errada.
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Erro na Evolution API: ${response.status} - ${response.statusText}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Retornamos 200 para o frontend tratar o erro de negócio
      });
    }

    const data = await response.json();
    
    // O formato de retorno da Evolution v1 geralmente é { instance: {...}, state: "open" }
    // Vamos retornar o dado cru para o frontend decidir
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