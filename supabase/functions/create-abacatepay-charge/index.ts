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
      .select('id, price_cents, name, description')
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
    
    // Validação dos dados do cliente
    if (!owner.name || !owner.email) {
        throw new Error("O Dono do negócio não tem nome ou e-mail cadastrado, que são obrigatórios para a cobrança.");
    }

    // 2. Criar cobrança na AbacatePay
    const abacateApiKey = 'abc_dev_cHnk2MfPmKabztKWSCNEys3K'; // Chave de sandbox
    if (!abacateApiKey) throw new Error("Chave da API AbacatePay não configurada.");

    const abacateApiUrl = 'https://api.abacatepay.com/v1/billing/create';
    console.log(`[create-abacatepay-charge] Conectando a: ${abacateApiUrl}`);

    // Montar payload do cliente de forma segura
    const customerPayload: { name: string; email: string; cellphone?: string } = {
        name: owner.name,
        email: owner.email,
    };
    const cleanPhone = business.phone?.replace(/\D/g, '');
    if (cleanPhone) {
        customerPayload.cellphone = cleanPhone;
    }

    const billingPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX", "CREDIT_CARD"],
      products: [
        {
          externalId: plan.id,
          name: `Assinatura AgendaPro - Plano ${plan.name}`,
          description: plan.description || `Acesso ao plano ${plan.name} por 30 dias.`,
          quantity: 1,
          price: plan.price_cents
        }
      ],
      returnUrl: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/#/manager/billing?status=success`,
      customer: customerPayload,
      externalId: `agendapro-business-${business.id}-${Date.now()}`,
      metadata: {
        business_id: business.id,
        plan_name: plan.name
      }
    };

    const abacateResponse = await fetch(abacateApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(billingPayload)
    });

    const responseBodyText = await abacateResponse.text();
    let billingData;
    try {
        billingData = JSON.parse(responseBodyText);
    } catch (e) {
        console.error("Failed to parse AbacatePay response:", responseBodyText);
        throw new Error(`Resposta inválida da AbacatePay: ${responseBodyText}`);
    }

    if (!abacateResponse.ok) {
      // Log aprimorado para depuração
      console.error("Erro na AbacatePay. Status:", abacateResponse.status, "Body:", billingData);
      
      // Tenta encontrar uma mensagem de erro mais descritiva
      const errorMessage = billingData.message || (Array.isArray(billingData.errors) && billingData.errors[0]?.message) || JSON.stringify(billingData);
      
      throw new Error(`Erro na AbacatePay: ${errorMessage}`);
    }
    
    if (!billingData.url) {
        throw new Error("A resposta da AbacatePay não continha uma URL de pagamento.");
    }

    // 3. Salvar cobrança no banco de dados
    const { data: payment, error: paymentInsertError } = await supabaseAdmin
      .from('business_payments')
      .insert({
        business_id: business_id,
        billing_id: billingData.id,
        status: 'PENDING',
        amount_cents: plan.price_cents,
        payment_url: billingData.url,
      })
      .select()
      .single();

    if (paymentInsertError) throw paymentInsertError;

    // 4. Atualizar status do negócio
    await supabaseAdmin
      .from('businesses')
      .update({ billing_status: 'payment_pending' })
      .eq('id', business_id);

    return new Response(JSON.stringify({ success: true, payment: { ...payment, payment_url: billingData.url } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Erro na função create-abacatepay-charge:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Retornar 200 para que o frontend possa exibir o erro de negócio
    });
  }
});