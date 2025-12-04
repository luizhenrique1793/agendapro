import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (_req) => {
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error("Os segredos EVOLUTION_API_URL ou EVOLUTION_API_KEY não foram encontrados. Verifique as configurações da função.");
    }

    // Vamos tentar uma requisição simples, como obter o estado de uma instância de teste.
    // Esperamos um erro de "instância não encontrada", o que significa que a conexão foi bem-sucedida.
    const testInstanceName = "connection_test";
    const response = await fetch(`${apiUrl}/instance/connectionState/${testInstanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
    });

    const responseData = await response.json();

    if (response.ok || response.status === 404) { // 404 é um sucesso para nós, significa que a API respondeu.
      return new Response(JSON.stringify({
        success: true,
        message: "Conexão com a Evolution API bem-sucedida!",
        api_response: responseData,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      throw new Error(`A API respondeu com status ${response.status}: ${JSON.stringify(responseData)}`);
    }

  } catch (error) {
    console.error("Erro no teste de conexão:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Falha ao conectar com a Evolution API.",
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});