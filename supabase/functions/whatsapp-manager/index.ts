import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const evolutionClient = {
  async request(endpoint: string, method: 'GET' | 'POST' | 'DELETE', body: object | null = null) {
    const url = `${EVOLUTION_API_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Evolution API Error (${response.status}):`, errorText);
      throw new Error(`Evolution API request failed with status ${response.status}`);
    }
    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : {};
  },
  createInstance(name: string) {
    const webhookUrl = `${APP_URL}/api/webhooks/whatsapp`;
    return this.request('/instance/create', 'POST', {
      instanceName: name,
      qrcode: true,
      webhook: webhookUrl,
    });
  },
  getConnectionState(instanceName: string) {
    return this.request(`/instance/connectionState/${instanceName}`, 'GET');
  },
  logoutInstance(instanceName: string) {
    return this.request(`/instance/logout/${instanceName}`, 'DELETE');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: businessId, error: rpcError } = await supabase.rpc('get_my_business_id');
    if (rpcError || !businessId) {
      throw new Error("Usuário não autenticado ou sem negócio vinculado.");
    }
    
    const instanceName = `business_${businessId.replace(/-/g, '')}`;

    if (req.method === 'GET') {
      let evolutionState = null;
      try {
        evolutionState = await evolutionClient.getConnectionState(instanceName);
      } catch (error) {
        console.log(`Could not get instance state from Evolution for ${instanceName}. Error: ${error.message}. Cleaning up stale instance.`);
        await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
        return new Response(JSON.stringify({ status: 'not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const currentState = evolutionState?.instance?.state;
      const qrCode = evolutionState?.instance?.qrcode?.base64;
      const phoneNumber = evolutionState?.instance?.owner?.replace('@s.whatsapp.net', '');

      const updatedInstanceData = {
        business_id: businessId,
        instance_name: instanceName,
        status: currentState || 'disconnected',
        qr_code: qrCode,
        phone_number: phoneNumber,
      };

      const { data: upsertedInstance, error: upsertError } = await supabase
        .from('whatsapp_instances')
        .upsert(updatedInstanceData, { onConflict: 'business_id' })
        .select()
        .single();

      if (upsertError) throw upsertError;
      return new Response(JSON.stringify(upsertedInstance), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
      const evolutionData = await evolutionClient.createInstance(instanceName);
      const newInstance = {
        business_id: businessId,
        instance_name: instanceName,
        api_key: evolutionData?.hash?.apikey,
        qr_code: evolutionData?.instance?.qrcode?.base64,
        status: 'connecting',
      };
      const { data, error } = await supabase.from('whatsapp_instances').upsert(newInstance, { onConflict: 'business_id' }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      try {
        await evolutionClient.logoutInstance(instanceName);
      } catch (error) {
        console.warn(`Could not logout instance ${instanceName} from Evolution. It might already be gone. Message: ${error.message}`);
      }
      await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
      return new Response(JSON.stringify({ message: 'Instância desconectada com sucesso.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Edge Function Final Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});