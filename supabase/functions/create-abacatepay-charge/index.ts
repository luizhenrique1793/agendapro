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

    // 2. Criar checkout na AbacatePay
    const abacateApiKey = 'abc_dev_cHnk2MfPmKabztKWSCNEys3K'; // Chave de sandbox
    if (!abacateApiKey) throw new Error("Chave da API AbacatePay não configurada.");

    // CORREÇÃO: URL da API e endpoint para criar checkout
    const abacateApiUrl = 'https://api.abacatepay.com.br/v1/checkouts';

    // CORREÇÃO: Payload ajustado para o endpoint /v1/checkouts
    const checkoutPayload = {
      charge: {
        amount: plan.price_cents,
        description: `Assinatura AgendaPro - Plano ${plan.name}`,
        customer: {
          name: owner.name,
          email: owner.email,
          mobile_phone: business.phone?.replace(/\D/g, '') || '',
        }
      },
      payment_methods: ["CREDIT_CARD", "PIX"],
      installments: [1], // Permitir apenas pagamento à vista
      success_url: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/#/manager/billing?status=success`,
    };

    const abacateResponse = await fetch(abacateApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutPayload)
    });

    const responseBodyText = await abacateResponse.text();
    let chargeData;
    try {
        chargeData = JSON.parse(responseBodyText);
    } catch (e) {
        console.error("Failed to parse AbacatePay response:", responseBodyText);
        throw new Error(`Resposta inválida da AbacatePay: ${responseBodyText}`);
    }

    if (!abacateResponse.ok) {
      console.error("Erro na AbacatePay:", chargeData);
      throw new Error(`Erro na AbacatePay: ${chargeData.message || 'Erro desconhecido'}`);
    }
    
    if (!chargeData.checkout_url) {
        throw new Error("A resposta da AbacatePay não continha uma URL de checkout.");
    }

    // 3. Salvar cobrança no banco de dados
    const { data: payment, error: paymentInsertError } = await supabaseAdmin
      .from('business_payments')
      .insert({
        business_id: business_id,
        billing_id: chargeData.id, // O checkout tem um ID
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
      status: 200, // Retornar 200 para o frontend tratar o erro de negócio
    });
  }
});