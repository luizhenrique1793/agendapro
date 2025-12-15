import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    const event = payload.event;
    const charge = payload.data;

    if (!event || !charge || !charge.id) {
      throw new Error("Payload do webhook inválido.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Encontrar o pagamento no banco
    const { data: payment, error: findError } = await supabaseAdmin
      .from('business_payments')
      .select('id, business_id, status')
      .eq('billing_id', charge.id)
      .single();

    if (findError || !payment) {
      console.warn(`Pagamento com billing_id ${charge.id} não encontrado.`);
      return new Response(JSON.stringify({ status: 'not_found' }), { status: 200 });
    }

    // 2. Atualizar o status do pagamento
    const newStatus = charge.status.toUpperCase();
    if (payment.status === newStatus) {
      return new Response(JSON.stringify({ status: 'already_updated' }), { status: 200 });
    }

    const { error: updatePaymentError } = await supabaseAdmin
      .from('business_payments')
      .update({ status: newStatus })
      .eq('id', payment.id);

    if (updatePaymentError) throw updatePaymentError;

    // 3. Se o pagamento foi PAGO, atualizar o negócio
    if (newStatus === 'PAID') {
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
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Erro no webhook AbacatePay:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});