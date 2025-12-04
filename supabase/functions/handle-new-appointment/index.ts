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
    const record = payload.record; // Supabase Webhook payload structure

    if (!record || !record.business_id || !record.client_phone) {
        return new Response('Invalid record data', { status: 200 });
    }

    // Inicializar Supabase Admin (para acessar a tabela businesses)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Buscar configuração do negócio
    const { data: business, error: bError } = await supabaseAdmin
        .from('businesses')
        .select('name, evolution_api_config')
        .eq('id', record.business_id)
        .single();
    
    if (bError || !business) {
        console.error('Business not found:', bError);
        return new Response('Business not found', { status: 200 });
    }

    const config = business.evolution_api_config;
    
    // Verificar se o negócio tem a API configurada
    if (!config || !config.instanceName || !config.serverUrl || !config.apiKey) {
        console.log('WhatsApp API not configured for this business');
        return new Response('No config', { status: 200 });
    }

    // 2. Buscar nome do serviço e profissional (opcional, para enriquecer a mensagem)
    const { data: service } = await supabaseAdmin.from('services').select('name').eq('id', record.service_id).single();
    const { data: professional } = await supabaseAdmin.from('professionals').select('name').eq('id', record.professional_id).single();

    // 3. Montar a mensagem
    const clientName = record.client_name || "Cliente";
    // Tenta formatar a data, assumindo YYYY-MM-DD
    const dateParts = record.date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}`; // DD/MM
    const time = record.time.substring(0, 5); // HH:MM
    const businessName = business.name;
    const serviceName = service?.name || "Serviço";
    const proName = professional?.name ? ` com ${professional.name}` : "";

    const message = `Olá ${clientName}! 👋\n\nSeu agendamento na *${businessName}* está confirmado!\n\n💇‍♂️ *${serviceName}*${proName}\n📅 Data: ${formattedDate}\n⏰ Horário: ${time}\n\nObrigado pela preferência!`;

    // 4. Enviar via Evolution API
    const normalizedUrl = config.serverUrl.replace(/\/$/, "");
    const endpoint = `${normalizedUrl}/message/sendText/${config.instanceName}`;
    const cleanPhone = record.client_phone.replace(/\D/g, "");

    console.log(`Sending auto-confirmation to ${cleanPhone} for business ${businessName}`);

    const apiPayload = {
      number: cleanPhone,
      text: message,
      options: { delay: 1000, presence: "composing" }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
            'apikey': config.apiKey, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`Evolution API Error: ${errText}`);
        return new Response(`API Error: ${errText}`, { status: 200 });
    }

    return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });

  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});