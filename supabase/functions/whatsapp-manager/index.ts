import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOK_URL = "https://webhook.automaleads.com/webhook/12d28f2f-0eee-402c-ae40-f9306b71bae9";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // --- POST: SAVE CONFIG & TRIGGER N8N ---
    if (req.method === 'POST') {
      const body = await req.json();
      const { instanceName, apiKey } = body;
      
      if (!instanceName) throw new Error("Nome da instância é obrigatório.");

      console.log(`[POST] Saving instance: ${instanceName}`);

      // 1. Save to Supabase (Persistence)
      const { data: dbData, error: dbError } = await supabase
        .from('whatsapp_instances')
        .upsert({
          business_id: businessId,
          instance_name: instanceName,
          api_key: apiKey || null,
          status: 'created', // Default status, n8n/webhook will update later if needed
          updated_at: new Date().toISOString()
        }, { onConflict: 'business_id' })
        .select()
        .single();

      if (dbError) throw new Error(`Erro ao salvar no banco: ${dbError.message}`);

      // 2. Trigger n8n Webhook (Fire and forget or wait for response)
      try {
        console.log(`[POST] Triggering n8n: ${N8N_WEBHOOK_URL}`);
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'configure_instance',
            business_id: businessId,
            instance_name: instanceName,
            api_key: apiKey,
            ...body
          })
        });
        
        if (!n8nResponse.ok) {
            console.error(`[n8n] Error ${n8nResponse.status}:`, await n8nResponse.text());
            // We don't throw here to avoid blocking the UI update, since DB is already updated
        } else {
            console.log(`[n8n] Success`);
        }
      } catch (err) {
        console.error(`[n8n] Connection failed:`, err);
      }

      return new Response(JSON.stringify(dbData), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // --- GET: READ STATUS (FROM DB ONLY) ---
    if (req.method === 'GET') {
      const { data: dbInstance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (!dbInstance) {
         return new Response(JSON.stringify({ status: 'no_instance' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // We stop querying Evolution directly here to avoid 500 errors.
      // Ideally, n8n should call a webhook back to update the status in the DB if it changes.
      // Or we can add a specific button in UI "Check Status" that triggers another n8n flow.

      return new Response(JSON.stringify(dbInstance), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // --- PUT: TRIGGER QR CODE GENERATION VIA N8N ---
    if (req.method === 'PUT') {
        const { data: dbInstance } = await supabase.from('whatsapp_instances').select('*').eq('business_id', businessId).single();
        if (!dbInstance) throw new Error("Instância não encontrada.");

        // Trigger n8n to fetch QR Code
        try {
            const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_qrcode',
                    business_id: businessId,
                    instance_name: dbInstance.instance_name,
                    api_key: dbInstance.api_key
                })
            });

            // If n8n returns the QR code directly
            const n8nJson = await n8nResponse.json();
            
            if (n8nJson.qrcode || n8nJson.base64) {
                const qrCode = n8nJson.qrcode || n8nJson.base64;
                await supabase
                    .from('whatsapp_instances')
                    .update({ qr_code: qrCode, status: 'connecting' })
                    .eq('business_id', businessId);
                
                return new Response(JSON.stringify({ qr_code: qrCode, status: 'connecting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        } catch (err) {
            console.error(err);
        }
        
        // Fallback response if n8n doesn't return immediately (async flow)
        return new Response(JSON.stringify({ status: 'requested' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- DELETE ---
    if (req.method === 'DELETE') {
        const { data: dbInstance } = await supabase.from('whatsapp_instances').select('*').eq('business_id', businessId).single();
        
        if (dbInstance) {
             // Notify n8n to cleanup if needed
             fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_instance', ...dbInstance })
            }).catch(console.error);
        }

        await supabase.from('whatsapp_instances').delete().eq('business_id', businessId);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

  } catch (error: any) {
    console.error("EDGE ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});