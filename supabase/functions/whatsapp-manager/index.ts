import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Check Environment Variables
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
    const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL');

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.error("Missing Env Vars: EVOLUTION_API_URL or EVOLUTION_API_KEY");
      throw new Error("Configuração do servidor incompleta (API Evolution).");
    }

    // 3. Setup Supabase Client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Sessão expirada ou inválida. Faça login novamente.");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // 4. Get User Business ID
    const { data: businessId, error: rpcError } = await supabase.rpc('get_my_business_id');
    
    if (rpcError) {
      console.error("RPC Error (get_my_business_id):", rpcError);
      throw new Error("Erro ao buscar dados do negócio.");
    }
    if (!businessId) {
      console.error("Business ID not found for user.");
      throw new Error("Nenhum negócio associado a este usuário.");
    }

    console.log(`[${req.method}] Request for Business: ${businessId}`);

    // Helper function for Evolution API calls to avoid repetition
    const callEvolution = async (endpoint: string, method: string, body: any = null) => {
      const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '');
      const url = `${baseUrl}${endpoint}`;
      
      console.log(`Evolution Call: ${method} ${url}`);
      
      const options: RequestInit = {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          'apikey': EVOLUTION_API_KEY 
        },
      };
      
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(url, options);
      const text = await res.text();
      
      let json = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch (e) {
        console.warn("Failed to parse Evolution response JSON:", text);
      }

      if (!res.ok) {
        console.error(`Evolution Error (${res.status}):`, text);
        // Tenta extrair mensagem de erro útil
        const msg = json.response?.message || json.message || json.error || `Erro API Evolution: ${res.status}`;
        throw new Error(msg);
      }
      
      return json;
    };

    // --- POST: CREATE INSTANCE ---
    if (req.method === 'POST') {
      const { instanceName } = await req.json();
      if (!instanceName) throw new Error("Nome da instância é obrigatório.");

      console.log(`Creating instance: ${instanceName}`);

      // Call Evolution API
      const webhookUrl = APP_URL ? `${APP_URL}/api/webhooks/whatsapp` : undefined;
      const evolutionData = await callEvolution('/instance/create', 'POST', {
        instanceName: instanceName,
        qrcode: false,
        token: crypto.randomUUID(), // Gera um token seguro para a instância
        webhook: webhookUrl,
        integration: "WHATSAPP-BAILEYS",
        reject_call: true,
        groups_ignore: true,
        always_online: true
      });

      console.log("Instance created successfully at Evolution:", evolutionData);

      // Extract API Key from response (Evolution v2 uses 'hash', others might vary)
      const instanceApiKey = evolutionData.hash?.apikey || evolutionData.apikey || evolutionData.instance?.apikey;

      // Save to Supabase
      const { data, error: dbError } = await supabase
        .from('whatsapp_instances')
        .upsert({
          business_id: businessId,
          instance_name: instanceName,
          api_key: instanceApiKey,
          status: 'created',
          qr_code: null
        }, { onConflict: 'business_id' })
        .select()
        .single();

      if (dbError) {
        console.error("DB Upsert Error:", dbError);
        // Tenta deletar na Evolution se falhou no banco para não ficar órfão
        try { await callEvolution(`/instance/delete/${instanceName}`, 'DELETE'); } catch(e) {}
        throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
      }

      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- GET: STATUS ---
    if (req.method === 'GET') {
      // First check DB
      const { data: dbInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('business_id', businessId)
        .maybeSingle();

      if (!dbInstance) {
        return new Response(JSON.stringify({ status: 'no_instance' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const instanceName = dbInstance.instance_name;
      let evolutionState = null;

      try {
        evolutionState = await callEvolution(`/instance/connectionState/${instanceName}`, 'GET');
      } catch (err: any) {
        // Se não achou na Evolution (404), deleta do banco local
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          console.warn(`Instance ${instanceName} not found in Evolution. Cleaning DB.`);
          await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
          return new Response(JSON.stringify({ status: 'not_found' }), { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        // Outros erros (timeout, auth, etc) apenas logamos e retornamos desconectado
        console.warn("Error fetching connection state:", err);
      }

      const currentState = evolutionState?.instance?.state || 'disconnected';
      const updatedData: any = { status: currentState };

      if (currentState === 'open') {
        const owner = evolutionState?.instance?.owner;
        updatedData.phone_number = owner ? owner.replace('@s.whatsapp.net', '') : null;
        updatedData.qr_code = null;
      }

      // Update DB asynchronously (don't await strictly if not critical)
      await supabase.from('whatsapp_instances').update(updatedData).eq('business_id', businessId);

      return new Response(JSON.stringify({ ...updatedData, instance_name: instanceName }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // --- PUT: CONNECT (QR CODE) ---
    if (req.method === 'PUT') {
      const { data: dbInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('business_id', businessId)
        .single();

      if (!dbInstance) throw new Error("Instância não encontrada.");
      
      const instanceName = dbInstance.instance_name;
      const connectData = await callEvolution(`/instance/connect/${instanceName}`, 'GET');

      const qrCode = connectData?.base64 || connectData?.qrcode?.base64;
      
      if (!qrCode) {
        // Verifica se já não está conectado
        const state = await callEvolution(`/instance/connectionState/${instanceName}`, 'GET');
        if (state?.instance?.state === 'open') throw new Error("Instância já conectada!");
        throw new Error("QR Code não retornado pela API.");
      }

      const { data } = await supabase
        .from('whatsapp_instances')
        .update({ qr_code: qrCode, status: 'connecting' })
        .eq('business_id', businessId)
        .select()
        .single();

      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- DELETE: REMOVE INSTANCE ---
    if (req.method === 'DELETE') {
      const { data: dbInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('business_id', businessId)
        .maybeSingle();

      if (dbInstance) {
        try {
          await callEvolution(`/instance/logout/${dbInstance.instance_name}`, 'DELETE');
        } catch (e) { console.warn("Logout error ignored"); }
        
        try {
          await callEvolution(`/instance/delete/${dbInstance.instance_name}`, 'DELETE');
        } catch (e) { console.warn("Delete error ignored"); }
      }

      await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("EDGE FUNCTION ERROR:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno do servidor." }), { 
      status: 500, // Mantive 500 para erros fatais, mas agora o JSON tem a mensagem do erro
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});