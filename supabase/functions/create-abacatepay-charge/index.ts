import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { business_id } = await req.json();
    if (!business_id) throw new Error("Business ID é obrigatório.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Buscar dados do negócio e do plano
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('plan')
      .eq('id', business_id)
      .single();

    if (businessError || !business || !business.plan) {
      throw new Error("Negócio ou plano não encontrado.");
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('price_cents, name')
      .eq('name', business.plan)
      .single();

    if (planError || !plan) {
      throw new Error(`Detalhes do plano "${business.plan}" não encontrados.`);
    }

    // 2. Criar cobrança na AbacatePay (simulado)
    const abacateApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!abacateApiKey) throw new Error("Chave da API AbacatePay não configurada.");

    const chargePayload = {
      amount: plan.price_cents,
      payment_method: "pix",
      description: `Assinatura AgendaPro - Plano ${plan.name}`,
      // customer: { ... } // Adicionar dados do cliente se necessário
    };

    // const abacateResponse = await fetch('https://api.abacatepay.com.br/v1/charges', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${abacateApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(chargePayload)
    // });
    // if (!abacateResponse.ok) {
    //   const errorBody = await abacateResponse.text();
    //   throw new Error(`Erro na AbacatePay: ${errorBody}`);
    // }
    // const chargeData = await abacateResponse.json();

    // ** DADOS MOCKADOS PARA DESENVOLVIMENTO **
    const chargeData = {
        id: `chg_${crypto.randomUUID()}`,
        status: 'pending',
        payment_url: 'https://abacatepay.com/pagar/123',
        pix_qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PIX_MOCK_${Date.now()}`,
        pix_emv: `00020126580014br.gov.bcb.pix...${Date.now()}`
    };
    // ** FIM DOS DADOS MOCKADOS **

    // 3. Salvar cobrança no banco de dados
    const { data: payment, error: paymentInsertError } = await supabaseAdmin
      .from('business_payments')
      .insert({
        business_id: business_id,
        billing_id: chargeData.id,
        status: chargeData.status.toUpperCase(),
        amount_cents: plan.price_cents,
        payment_url: chargeData.payment_url,
        pix_qr_code: chargeData.pix_qr_code,
        pix_emv: chargeData.pix_emv,
      })
      .select()
      .single();

    if (paymentInsertError) throw paymentInsertError;

    // 4. Atualizar status do negócio
    await supabaseAdmin
      .from('businesses')
      .update({ billing_status: 'payment_pending' })
      .eq('id', business_id);

    return new Response(JSON.stringify({ success: true, payment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Erro na função create-abacatepay-charge:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Retornar 200 para o frontend tratar o erro de negócio
    });
  }
});