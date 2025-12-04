import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error("Configuração do servidor incompleta (EVOLUTION_API_URL/KEY).");
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Sem autorização.");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get Business ID
    const { data: businessId, error: rpcError } = await supabase.rpc('get_my_business_id');
    if (rpcError || !businessId) throw new Error("Negócio não identificado.");

    // Helper for Evolution API
    const requestEvolution = async (endpoint: string, method: string, body: any = null, customApiKey?: string) => {
      const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '');
      const url = `${baseUrl}${endpoint}`;
      
      // Use the Global Key for management, or the specific instance key if provided/needed
      const headers: any = { 
        'Content-Type': 'application/json', 
        'apikey': EVOLUTION_API_KEY 
      };

      const options: RequestInit = { method, headers };
      if (body) options.body = JSON.stringify(body);

      console.log(`[Evolution] ${method} ${url}`);
      const res = await fetch(url, options);
      const text = await res.text();
      
      try {
        const json = text ? JSON.parse(text) : {};
        if (!res.ok) {
           throw new Error(json.response?.message || json.message || `Erro ${res.status}`);
        }
        return json;
      } catch (e) {
        if (!res.ok) throw new Error(`Erro API (${res.status}): ${text}`);
        return {};
      }
    };

    // --- POST: CREATE OR CONNECT MANUAL ---
    if (req.method === 'POST') {
      const { instanceName, apiKey: manualApiKey } = await req.json();
      
      if (!instanceName) throw new Error("Nome da instância é obrigatório.");

      let finalApiKey = manualApiKey;
      let phoneNumber = null;
      let status = 'created';

      if (manualApiKey) {
        // --- MODO MANUAL: Apenas valida e salva ---
        console.log(`Connecting existing instance: ${instanceName}`);
        
        // 1. Verifica se a instância existe na Evolution e pega o status
        try {
          const stateData = await requestEvolution(`/instance/connectionState/${instanceName}`, 'GET');
          status = stateData?.instance?.state || 'created';
          
          if (status === 'open') {
             const owner = stateData?.instance?.owner;
             phoneNumber = owner ? owner.replace('@s.whatsapp.net', '') : null;
          }
        } catch (e) {
          console.warn("Could not verify status on Evolution, saving anyway:", e);
          // Se der erro ao consultar (ex: 404), salvamos mesmo assim para o usuário tentar conectar depois
        }

      } else {
        // --- MODO AUTOMÁTICO: Cria a instância ---
        /* Lógica anterior de criação removida para focar no manual solicitado, 
           mas mantendo suporte básico se necessário futuramente */
        throw new Error("Modo de criação automática desabilitado temporariamente. Forneça a API Key.");
      }

      // Salva no banco Supabase
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .upsert({
          business_id: businessId,
          instance_name: instanceName,
          api_key: finalApiKey,
          status: status,
          phone_number: phoneNumber,
          qr_code: null // Limpa QR code antigo se houver
        }, { onConflict: 'business_id' })
        .select()
        .single();

      if (error) throw new Error(`Erro banco de dados: ${error.message}`);

      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- GET: STATUS ---
    if (req.method === 'GET') {
      const { data: dbInstance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (!dbInstance) {
         return new Response(JSON.stringify({ status: 'no_instance' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Atualiza status real time
      try {
        const stateData = await requestEvolution(`/instance/connectionState/${dbInstance.instance_name}`, 'GET');
        const currentState = stateData?.instance?.state || 'disconnected';
        
        const updates: any = { status: currentState };
        if (currentState === 'open') {
             const owner = stateData?.instance?.owner;
             updates.phone_number = owner ? owner.replace('@s.whatsapp.net', '') : null;
             updates.qr_code = null;
        }

        await supabase.from('whatsapp_instances').update(updates).eq('business_id', businessId);
        
        return new Response(JSON.stringify({ ...dbInstance, ...updates }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (e) {
        // Se der erro de conexão com a API, retorna o que tem no banco
        return new Response(JSON.stringify(dbInstance), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // --- PUT: GET QR CODE ---
    if (req.method === 'PUT') {
        const { data: dbInstance } = await supabase.from('whatsapp_instances').select('*').eq('business_id', businessId).single();
        if (!dbInstance) throw new Error("Instância não encontrada.");

        const connectData = await requestEvolution(`/instance/connect/${dbInstance.instance_name}`, 'GET');
        const qrCode = connectData?.base64 || connectData?.qrcode?.base64;

        if (qrCode) {
            await supabase.from('whatsapp_instances').update({ qr_code: qrCode, status: 'connecting' }).eq('business_id', businessId);
            return new Response(JSON.stringify({ qr_code: qrCode, status: 'connecting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        throw new Error("QR Code não gerado. Verifique se já está conectado.");
    }

    // --- DELETE ---
    if (req.method === 'DELETE') {
        await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});