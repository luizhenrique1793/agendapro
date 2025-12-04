import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const evolutionClient = {
  async request(endpoint: string, method: 'GET' | 'POST' | 'DELETE', body: object | null = null, apiKey: string, apiUrl: string) {
    const url = `${apiUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    
    // Evolution API sometimes returns 400/404/500 but with JSON body error.
    // Try to parse JSON even on error to get message.
    const responseText = await response.text();
    let responseData = {};
    try {
        responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
        console.error("Error parsing response JSON:", e);
    }

    if (!response.ok) {
      console.error(`Evolution API Error (${response.status}):`, responseText);
      // Return the error message from Evolution if available
      const msg = responseData.response?.message || responseData.message || responseText || `Error ${response.status}`;
      throw new Error(msg);
    }
    
    return responseData;
  },
  
  createInstance(name: string, apiKey: string, apiUrl: string, appUrl: string) {
    const webhookUrl = `${appUrl}/api/webhooks/whatsapp`;
    return this.request('/instance/create', 'POST', {
      instanceName: name,
      qrcode: false, // Don't generate QR on create
      webhook: webhookUrl,
    }, apiKey, apiUrl);
  },

  connectInstance(instanceName: string, apiKey: string, apiUrl: string) {
    return this.request(`/instance/connect/${instanceName}`, 'GET', null, apiKey, apiUrl);
  },

  getConnectionState(instanceName: string, apiKey: string, apiUrl: string) {
    return this.request(`/instance/connectionState/${instanceName}`, 'GET', null, apiKey, apiUrl);
  },

  logoutInstance(instanceName: string, apiKey: string, apiUrl: string) {
    return this.request(`/instance/logout/${instanceName}`, 'DELETE', null, apiKey, apiUrl);
  },
  
  deleteInstance(instanceName: string, apiKey: string, apiUrl: string) {
    return this.request(`/instance/delete/${instanceName}`, 'DELETE', null, apiKey, apiUrl);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
    const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL');

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !APP_URL) {
      throw new Error("Variáveis de ambiente da Evolution API não estão configuradas corretamente.");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: businessId, error: rpcError } = await supabase.rpc('get_my_business_id');
    if (rpcError || !businessId) {
      throw new Error("Usuário não autenticado ou sem negócio vinculado.");
    }
    
    // Normalize instance name
    const instanceName = `business_${businessId.replace(/-/g, '')}`;

    // --- GET: Check Status ---
    if (req.method === 'GET') {
      let evolutionState = null;
      try {
        evolutionState = await evolutionClient.getConnectionState(instanceName, EVOLUTION_API_KEY, EVOLUTION_API_URL);
      } catch (error) {
        // If 404/not found in Evolution, sync DB
        if (error.message.includes('not found') || error.message.includes('404')) {
             await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
             return new Response(JSON.stringify({ status: 'not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        // If fetching status fails for other reasons, keep DB as is but return error? 
        // Or assume "disconnected". Let's assume disconnected to allow UI to retry.
      }

      const currentState = evolutionState?.instance?.state || 'disconnected';
      
      // We don't necessarily get QR code in connectionState unless we call connect.
      // So we update status only.
      
      const updatedData: any = { status: currentState };
      if (currentState === 'open') {
          updatedData.phone_number = evolutionState?.instance?.owner?.replace('@s.whatsapp.net', '');
          updatedData.qr_code = null; // Clear QR if connected
      }

      const { data: upsertedInstance } = await supabase
        .from('whatsapp_instances')
        .update(updatedData)
        .eq('business_id', businessId)
        .select()
        .single();
        
      return new Response(JSON.stringify(upsertedInstance || { status: currentState }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- POST: Create Instance (No QR) ---
    if (req.method === 'POST') {
      const evolutionData = await evolutionClient.createInstance(instanceName, EVOLUTION_API_KEY, EVOLUTION_API_URL, APP_URL);
      
      const newInstance = {
        business_id: businessId,
        instance_name: instanceName,
        api_key: evolutionData?.hash?.apikey || evolutionData?.apikey, // Check both possibilities
        status: 'created',
        qr_code: null
      };
      
      const { data, error } = await supabase.from('whatsapp_instances').upsert(newInstance, { onConflict: 'business_id' }).select().single();
      if (error) throw error;
      
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- PUT: Connect (Get QR Code) ---
    if (req.method === 'PUT') {
        const connectData = await evolutionClient.connectInstance(instanceName, EVOLUTION_API_KEY, EVOLUTION_API_URL);
        
        // Evolution returns { code, base64 } usually
        const qrCode = connectData?.base64 || connectData?.qrcode?.base64;
        
        if (!qrCode) {
             // If no QR code returned, maybe already connected?
             const state = await evolutionClient.getConnectionState(instanceName, EVOLUTION_API_KEY, EVOLUTION_API_URL);
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
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- DELETE: Logout/Delete ---
    if (req.method === 'DELETE') {
      try {
        await evolutionClient.logoutInstance(instanceName, EVOLUTION_API_KEY, EVOLUTION_API_URL);
        // Also try to delete to be clean
        await evolutionClient.deleteInstance(instanceName, EVOLUTION_API_KEY, EVOLUTION_API_URL);
      } catch (error) {
        console.warn(`Clean up error: ${error.message}`);
      }
      
      await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
      return new Response(JSON.stringify({ message: 'Instância removida.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});