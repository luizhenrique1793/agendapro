import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOK_URL = "https://webhook.automaleads.com/webhook/12d28f2f-0eee-402c-ae40-f9306b71bae9";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Setup Supabase Client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Token de autorização ausente.");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2. Identify Business
    const { data: businessId, error: rpcError } = await supabase.rpc('get_my_business_id');
    if (rpcError || !businessId) {
      console.error("RPC Error or No Business ID:", rpcError);
      throw new Error("Não foi possível identificar seu negócio. Faça login novamente.");
    }

    // --- POST: Connect/Save Instance ---
    if (req.method === 'POST') {
      const body = await req.json();
      const { instanceName, apiKey } = body;

      if (!instanceName) throw new Error("O nome da instância é obrigatório.");

      console.log(`[POST] Salvando instância para Business ${businessId}: ${instanceName}`);

      // A. Save to Database FIRST
      // Usamos onConflict para garantir update se já existir
      const { data: dbData, error: dbError } = await supabase
        .from('whatsapp_instances')
        .upsert({
          business_id: businessId,
          instance_name: instanceName,
          api_key: apiKey || null,
          status: 'created', // Reset status to created on new save
          updated_at: new Date().toISOString()
        }, { onConflict: 'business_id' })
        .select()
        .single();

      if (dbError) {
        console.error("Database Upsert Error:", dbError);
        throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
      }

      // B. Trigger Webhook (Non-blocking / Best effort)
      // Não esperamos falha do webhook bloquear o sucesso da UI
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure_instance',
          business_id: businessId,
          instance_name: instanceName,
          api_key: apiKey,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
      }).then(res => {
         console.log(`Webhook Triggered: ${res.status}`);
      }).catch(err => {
         console.error("Webhook Trigger Failed:", err);
      });

      return new Response(JSON.stringify(dbData), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // --- GET: Fetch Status ---
    if (req.method === 'GET') {
      const { data: dbInstance, error: dbError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!dbInstance) {
         return new Response(JSON.stringify({ status: 'no_instance' }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
         });
      }

      return new Response(JSON.stringify(dbInstance), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // --- PUT: Request QR Code ---
    if (req.method === 'PUT') {
        const { data: dbInstance } = await supabase
            .from('whatsapp_instances')
            .select('*')
            .eq('business_id', businessId)
            .single();
            
        if (!dbInstance) throw new Error("Nenhuma instância configurada.");

        // Call Webhook to get QR
        const webhookResp = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get_qrcode',
                business_id: businessId,
                instance_name: dbInstance.instance_name,
                api_key: dbInstance.api_key
            })
        });

        const webhookData = await webhookResp.json().catch(() => ({}));
        
        if (webhookData.qrcode || webhookData.base64) {
             const qrCode = webhookData.qrcode || webhookData.base64;
             // Update DB with QR
             await supabase
                .from('whatsapp_instances')
                .update({ qr_code: qrCode, status: 'connecting' })
                .eq('business_id', businessId);

             return new Response(JSON.stringify({ qr_code: qrCode, status: 'connecting' }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
             });
        }

        return new Response(JSON.stringify({ status: 'requested', message: 'Solicitação enviada ao webhook' }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // --- DELETE ---
    if (req.method === 'DELETE') {
        const { data: dbInstance } = await supabase.from('whatsapp_instances').select('*').eq('business_id', businessId).single();
        
        if (dbInstance) {
             fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_instance', ...dbInstance })
            }).catch(console.error);
        }

        await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
        
        return new Response(JSON.stringify({ success: true }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

  } catch (error: any) {
    console.error("EDGE FUNCTION ERROR:", error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno no servidor',
      details: error.toString() 
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});