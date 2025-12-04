import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper para requisições HTTP
const requestEvolution = async (endpoint: string, method: 'GET' | 'POST' | 'DELETE' | 'PUT', body: object | null, apiKey: string, apiUrl: string) => {
  // Remove barra final da URL se existir
  const cleanUrl = apiUrl.replace(/\/$/, '');
  const url = `${cleanUrl}${endpoint}`;
  
  console.log(`[Evolution] Requesting ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    let responseData: any = {};
    try {
        responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
        console.warn("[Evolution] Could not parse JSON response:", e);
    }

    if (!response.ok) {
      console.error(`[Evolution] API Error (${response.status}):`, responseText);
      const msg = responseData.response?.message || responseData.message || `Evolution API Error: ${response.statusText}`;
      throw new Error(msg);
    }
    
    return responseData;
  } catch (error) {
    console.error(`[Evolution] Fetch error:`, error);
    throw error;
  }
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
    const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL');

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !APP_URL) {
      throw new Error("Variáveis de ambiente (EVOLUTION_API_URL, EVOLUTION_API_KEY, NEXT_PUBLIC_APP_URL) não configuradas.");
    }

    // Cria cliente Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Obtém ID do negócio
    const { data: businessId, error: rpcError } = await supabase.rpc('get_my_business_id');
    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error("Erro ao identificar negócio do usuário.");
    }
    if (!businessId) {
      throw new Error("Usuário não possui um negócio vinculado.");
    }

    console.log(`Processing request for business: ${businessId}, Method: ${req.method}`);

    // --- POST: Create Instance ---
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { instanceName } = body;
      
      if (!instanceName) {
        throw new Error("Nome da instância é obrigatório.");
      }

      console.log(`Creating instance: ${instanceName}`);
      const webhookUrl = `${APP_URL}/api/webhooks/whatsapp`;
      
      const evolutionData = await requestEvolution('/instance/create', 'POST', {
        instanceName: instanceName,
        qrcode: false,
        webhook: webhookUrl,
        integration: "WHATSAPP-BAILEYS",
        reject_call: true,
        groups_ignore: true,
        always_online: true
      }, EVOLUTION_API_KEY, EVOLUTION_API_URL);
      
      console.log("Instance created at Evolution:", evolutionData);

      // Salva no banco
      const newInstance = {
        business_id: businessId,
        instance_name: instanceName,
        api_key: evolutionData?.hash?.apikey || evolutionData?.apikey || evolutionData?.instance?.apikey,
        status: 'created',
        qr_code: null
      };
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .upsert(newInstance, { onConflict: 'business_id' })
        .select()
        .single();
        
      if (error) {
        console.error("Supabase DB Error:", error);
        throw new Error("Erro ao salvar instância no banco de dados.");
      }
      
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Para as outras rotas, buscamos a instância existente
    const { data: existingInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('business_id', businessId)
      .maybeSingle();

    if (fetchError) {
       console.error("Error fetching instance:", fetchError);
       throw new Error("Erro ao buscar dados da instância.");
    }

    // --- GET: Check Status ---
    if (req.method === 'GET') {
      if (!existingInstance) {
          return new Response(JSON.stringify({ status: 'no_instance' }), { 
            status: 404, // Retornamos 404 para o front saber que não tem instância
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
      }

      const instanceName = existingInstance.instance_name;
      let evolutionState = null;
      
      try {
        evolutionState = await requestEvolution(`/instance/connectionState/${instanceName}`, 'GET', null, EVOLUTION_API_KEY, EVOLUTION_API_URL);
      } catch (error: any) {
         if (error.message?.includes('not found') || error.message?.includes('404')) {
             console.log("Instance not found in Evolution, deleting from DB...");
             await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
             return new Response(JSON.stringify({ status: 'not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
         }
         console.warn("Error checking status:", error);
         // Don't throw here, just return current DB state or disconnected
      }

      const currentState = evolutionState?.instance?.state || 'disconnected';
      const updatedData: any = { status: currentState };
      
      if (currentState === 'open') {
          // Tenta limpar o número (remove @s.whatsapp.net)
          const owner = evolutionState?.instance?.owner;
          updatedData.phone_number = owner ? owner.split('@')[0] : null;
          updatedData.qr_code = null;
      }

      // Atualiza status no banco
      const { data: upsertedInstance } = await supabase
        .from('whatsapp_instances')
        .update(updatedData)
        .eq('business_id', businessId)
        .select()
        .single();
        
      return new Response(JSON.stringify(upsertedInstance || { status: currentState }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // --- PUT: Connect (Get QR Code) ---
    if (req.method === 'PUT') {
        if (!existingInstance) throw new Error("Instância não encontrada no banco de dados.");
        const instanceName = existingInstance.instance_name;

        console.log(`Requesting connection for: ${instanceName}`);
        const connectData = await requestEvolution(`/instance/connect/${instanceName}`, 'GET', null, EVOLUTION_API_KEY, EVOLUTION_API_URL);
        
        const qrCode = connectData?.base64 || connectData?.qrcode?.base64;
        
        if (!qrCode) {
             // Check if already connected
             const state = await requestEvolution(`/instance/connectionState/${instanceName}`, 'GET', null, EVOLUTION_API_KEY, EVOLUTION_API_URL);
             if (state?.instance?.state === 'open') {
                 throw new Error("Instância já está conectada.");
             }
             throw new Error("Não foi possível obter o QR Code da API.");
        }

        const { data, error } = await supabase
            .from('whatsapp_instances')
            .update({ qr_code: qrCode, status: 'connecting' })
            .eq('business_id', businessId)
            .select()
            .single();
            
        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // --- DELETE: Logout/Delete ---
    if (req.method === 'DELETE') {
      if (existingInstance) {
          const instanceName = existingInstance.instance_name;
          console.log(`Deleting instance: ${instanceName}`);
          try {
            await requestEvolution(`/instance/logout/${instanceName}`, 'DELETE', null, EVOLUTION_API_KEY, EVOLUTION_API_URL);
          } catch (e) { console.warn("Logout error (ignored):", e); }
          
          try {
            await requestEvolution(`/instance/delete/${instanceName}`, 'DELETE', null, EVOLUTION_API_KEY, EVOLUTION_API_URL);
          } catch (e) { console.warn("Delete error (ignored):", e); }
      }
      
      await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
      return new Response(JSON.stringify({ message: 'Instância removida.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("FATAL ERROR:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});