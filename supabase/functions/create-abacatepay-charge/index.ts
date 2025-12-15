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

    // 1. Buscar dados do negócio, do plano e do dono
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, plan, phone')
      .eq('id', business_id)
      .single();

    if (businessError || !business || !business.plan) {
      throw new Error("Negócio ou plano não encontrado.");
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id, price_cents, name')
      .eq('name', business.plan)
      .single();

    if (planError || !plan) {
      throw new Error(`Detalhes do plano "${business.plan}" não encontrados.`);
    }

    const { data: owner, error: ownerError } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('business_id', business_id)
        .eq('role', 'Dono')
        .limit(1)
        .single();

    if (ownerError || !owner) {
        throw new Error("Dono do negócio não encontrado para criar a cobrança.");
    }

    // 2. Criar cobrança/checkout na AbacatePay
    const abacateApiKey = 'abc_dev_cHnk2MfPmKabztKWSCNEys3K';
    if (!abacateApiKey) throw new Error("Chave da API AbacatePay não configurada.");

    // URL correta da API de sandbox da AbacatePay para criar um checkout
    const abacateApiUrl = 'https://sandbox.abacatepay.com/api/v1/billing/create';

    const checkoutPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: plan.id,
          name: `AgendaPro - Plano ${plan.name}`,
          quantity: 1,
          price: plan.price_cents
        }
      ],
      returnUrl: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/#/manager/billing`,
      completionUrl: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/#/manager/billing`,
      customer: {
        email: owner.email,
        cellphone: business.phone?.replace(/\D/g, '') || '',
        name: owner.name,
      },
      allowCoupons: false,
      externalId: `agendapro-${business_id}-${Date.now()}`,
    };

    const abacateResponse = await fetch(abacateApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutPayload)
    });

    if (!abacateResponse.ok) {
      const errorBody = await abacateResponse.json();
      console.error("Erro na AbacatePay:", errorBody);
      throw new Error(`Erro na AbacatePay: ${errorBody.message || 'Erro desconhecido'}`);
    }
    
    const chargeData = await abacateResponse.json();

    if (!chargeData.checkout_url) {
        throw new Error("A resposta da AbacatePay não continha uma URL de checkout.");
    }

    // 3. Salvar cobrança no banco de dados
    const { data: payment, error: paymentInsertError } = await supabaseAdmin
      .from('business_payments')
      .insert({
        business_id: business_id,
        billing_id: chargeData.id,
        status: 'PENDING',
        amount_cents: plan.price_cents,
        payment_url: chargeData.checkout_url,
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
      status: 200,
    });
  }
});