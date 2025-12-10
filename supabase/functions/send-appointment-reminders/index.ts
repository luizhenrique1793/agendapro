import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        client_name,
        client_phone,
        time,
        status,
        date,
        businesses (
          id,
          name,
          evolution_api_config,
          reminder_config
        ),
        services (name),
        professionals (name)
      `)
      .eq('date', today)
      .neq('status', 'Cancelado');

    if (error) {
        throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    }

    const results = [];

    for (const appt of appointments || []) {
      const business = appt.businesses;
      
      if (!business?.evolution_api_config?.serverUrl || 
          !business.evolution_api_config.apiKey || 
          !business.evolution_api_config.instanceName || 
          !appt.client_phone) {
        results.push({ id: appt.id, status: 'skipped', reason: 'no_config_or_phone' });
        continue;
      }

      // Obter configuração de lembretes do negócio (com valores padrão)
      const reminderConfig = business.reminder_config || {
        same_day_enabled: true,
        same_day_hours_before: 2,
        previous_day_enabled: true,
        early_threshold_hour: "09:00",
        previous_day_time: "19:00"
      };

      // Preparar mensagem baseada na configuração
      const clientFirstName = appt.client_name.split(' ')[0];
      const time = appt.time.substring(0, 5);
      const serviceName = appt.services?.name || 'serviço';
      const businessName = business.name;
      const proName = appt.professionals?.name ? ` com ${appt.professionals.name}` : '';
      
      // Verificar se é para amanhã ou hoje baseado na configuração
      const apptDate = new Date(appt.date);
      const todayDate = new Date(today);
      const isTomorrow = apptDate > todayDate;
      
      // Aplicar lógica de configuração: verificar se é horário "muito cedo"
      const apptHour = appt.time.substring(0, 5);
      const isEarlyAppointment = apptHour < reminderConfig.early_threshold_hour;
      const willSendTomorrow = isEarlyAppointment && reminderConfig.previous_day_enabled;
      
      let timeDescription;
      if (isTomorrow || willSendTomorrow) {
        timeDescription = 'amanhã';
      } else {
        timeDescription = 'hoje';
      }
      
      const message = `Olá ${clientFirstName}! ☀️\n\nPassando para lembrar do seu horário ${timeDescription} às *${time}* na *${businessName}* para *${serviceName}*${proName}.\n\nEstamos te esperando! 😉`;

      try {
        const normalizedUrl = business.evolution_api_config.serverUrl.replace(/\/$/, "");
        const endpoint = `${normalizedUrl}/message/sendText/${business.evolution_api_config.instanceName}`;
        const cleanPhone = appt.client_phone.replace(/\D/g, "");

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
                'apikey': business.evolution_api_config.apiKey, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                number: cleanPhone,
                text: message,
                options: { delay: 1000 }
            })
        });

        if (response.ok) {
            results.push({ id: appt.id, status: 'sent', phone: cleanPhone });
        } else {
            const errText = await response.text();
            results.push({ id: appt.id, status: 'failed', error: errText });
        }
      } catch (e) {
        console.error(`Failed to send to ${appt.id}`, e);
        results.push({ id: appt.id, status: 'failed', error: e.message });
      }
    }

    return new Response(JSON.stringify({ success: true, date: today, processed: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});