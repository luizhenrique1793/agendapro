import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cliente da Evolution API
const evolutionClient = {
  async request(endpoint: string, method: 'GET' | 'POST' | 'DELETE', body: object | null = null) {
    const url = `${EVOLUTION_API_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Evolution API Error: ${error.message || response.statusText}`);
    }
    return response.json();
  },

  createInstance(name: string) {
    const webhookUrl = `${APP_URL}/api/webhooks/whatsapp`; // Futuro webhook
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.business_id) {
      throw new Error("Negócio não encontrado para este usuário.");
    }
    const businessId = profile.business_id;
    const instanceName = `business_${businessId.replace(/-/g, '')}`;

    // --- Lógica de Roteamento ---

    // GET: Obter status da instância
    if (req.method === 'GET') {
      const { data: existingInstance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('business_id', businessId)
        .single();

      if (!existingInstance) {
        return new Response(JSON.stringify({ status: 'not_found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
      
      // Consulta o status real na Evolution API
      const evolutionState = await evolutionClient.getConnectionState(instanceName);
      
      // Atualiza nosso banco se houver divergência
      if (existingInstance.status !== evolutionState.instance.state) {
          const { data: updatedInstance } = await supabase
              .from('whatsapp_instances')
              .update({ status: evolutionState.instance.state, qr_code: evolutionState.instance.qrcode })
              .eq('id', existingInstance.id)
              .select()
              .single();
          return new Response(JSON.stringify(updatedInstance), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify(existingInstance), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST: Criar uma nova instância
    if (req.method === 'POST') {
      const evolutionData = await evolutionClient.createInstance(instanceName);
      
      const newInstance = {
        business_id: businessId,
        instance_name: instanceName,
        api_key: evolutionData.hash.apikey,
        qr_code: evolutionData.instance.qrcode,
        status: 'connecting',
      };

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert(newInstance)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // DELETE: Desconectar e remover instância
    if (req.method === 'DELETE') {
      await evolutionClient.logoutInstance(instanceName);
      
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('business_id', businessId);

      if (error) throw error;
      return new Response(JSON.stringify({ message: 'Instância desconectada com sucesso.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});