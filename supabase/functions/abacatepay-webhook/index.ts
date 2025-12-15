import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { timingSafeEqual } from "https://deno.land/std@0.168.0/crypto/timing_safe_equal.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-abacatepay-signature',
};

// Helper to verify the HMAC-SHA256 signature from AbacatePay
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  
  // Convert the generated signature to a hex string
  const hex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Compare the generated signature with the one from the header in a timing-safe way
  try {
    return timingSafeEqual(encoder.encode(hex), encoder.encode(signature));
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Get signature, raw payload, and secret
  const signature = req.headers.get('X-AbacatePay-Signature');
  const payload = await req.text();
  const secret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET');

  // 2. Validate presence of required elements for verification
  if (!secret) {
    console.error('[AbacatePay Webhook] Webhook secret (ABACATEPAY_WEBHOOK_SECRET) is not configured.');
    return new Response('Webhook secret not configured.', { status: 500 });
  }
  if (!signature) {
    console.error('[AbacatePay Webhook] Request is missing X-AbacatePay-Signature header.');
    return new Response('Webhook signature missing.', { status: 400 });
  }
  if (!payload) {
    console.error('[AbacatePay Webhook] Request has an empty payload.');
    return new Response('Webhook payload missing.', { status: 400 });
  }

  // 3. Verify the signature
  const isValid = await verifySignature(payload, signature, secret);
  if (!isValid) {
    console.error('[AbacatePay Webhook] Invalid webhook signature.');
    return new Response('Invalid webhook signature.', { status: 400 });
  }

  console.log('[AbacatePay Webhook] Signature verified successfully.');

  try {
    const data = JSON.parse(payload);
    console.log(`[AbacatePay Webhook] Received event: ${data.event}`);

    // 4. Validate the structure of the parsed payload
    if (!data.event || !data.data || !data.data.id) {
      console.error('[AbacatePay Webhook] Invalid payload structure. "event" or "data" or "data.id" is missing.');
      return new Response('Invalid payload structure.', { status: 400 });
    }

    const event = data.event;
    const charge = data.data;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 5. Find the corresponding payment in the database
    console.log(`[AbacatePay Webhook] Searching for payment with billing_id: ${charge.id}`);
    const { data: payment, error: findError } = await supabaseAdmin
      .from('business_payments')
      .select('id, business_id, status')
      .eq('billing_id', charge.id)
      .single();

    if (findError || !payment) {
      console.warn(`[AbacatePay Webhook] Payment with billing_id ${charge.id} not found. Acknowledging receipt to prevent retries.`);
      return new Response(JSON.stringify({ status: 'not_found' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }
    console.log(`[AbacatePay Webhook] Found payment record: ${payment.id}`);

    // 6. Update the payment status in the database
    const newStatus = charge.status.toUpperCase();
    if (payment.status === newStatus) {
      console.log(`[AbacatePay Webhook] Payment ${payment.id} already has status ${newStatus}. No update needed.`);
      return new Response(JSON.stringify({ status: 'already_updated' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    console.log(`[AbacatePay Webhook] Updating payment ${payment.id} status from ${payment.status} to ${newStatus}.`);
    const { error: updatePaymentError } = await supabaseAdmin
      .from('business_payments')
      .update({ status: newStatus })
      .eq('id', payment.id);

    if (updatePaymentError) throw updatePaymentError;

    // 7. If the payment was successful, activate the business subscription
    if (newStatus === 'PAID') {
      console.log(`[AbacatePay Webhook] Payment is PAID. Updating business ${payment.business_id}.`);
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 30);

      const { error: updateBusinessError } = await supabaseAdmin
        .from('businesses')
        .update({
          billing_status: 'active',
          payment_due_at: nextDueDate.toISOString(),
        })
        .eq('id', payment.business_id);

      if (updateBusinessError) throw updateBusinessError;
      console.log(`[AbacatePay Webhook] Business ${payment.business_id} subscription activated.`);
    }

    console.log('[AbacatePay Webhook] Processed successfully.');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("[AbacatePay Webhook] Critical error processing payload:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});