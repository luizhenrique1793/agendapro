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
      const config = appt.businesses?.evolution_api_config;
      const reminderConfig = appt.businesses?.reminder_config || {
        same_day_enabled: true,
        previous_day_time: "19:00",
        early_threshold_hour: "09:00",
        previous_day_enabled: true,
        same_day_hours_before: 2
      };
      
      if (!config || !config.serverUrl || !config.apiKey || !config.instanceName || !appt.client_phone) {
        results.push({ id: appt.id, status: 'skipped', reason: 'no_config_or_phone' });
        continue;
      }

      // MELHORIA: Usar configuração personalizada para determinar se é "amanhã" ou "hoje"
      const apptHour = parseInt(appt.time.split(':')[0]);
      const earlyThreshold = parseInt(reminderConfig.early_threshold_hour.split(':')[0]);
      
      let timeDescription;
      if (reminderConfig.previous_day_enabled && apptHour < earlyThreshold) {
        timeDescription = 'amanhã';
      } else {
        timeDescription = 'hoje';
      }
      
      const clientFirstName = appt.client_name.split(' ')[0];
      const time = appt.time.substring(0, 5);
      const serviceName = appt.services?.name || 'serviço';
      const businessName = appt.businesses?.name || 'Barbearia';
      const proName = appt.professionals?.name ? ` com ${appt.professionals.name}` : '';
      
      const message = `Olá ${clientFirstName}! ☀️\n\nPassando para lembrar do seu horário ${timeDescription} às *${time}* na *${businessName}* para *${serviceName}*${proName}.\n\nEstamos te esperando! 😉`;

      try {
        const normalizedUrl = config.serverUrl.replace(/\/$/, "");
        const endpoint = `${normalizedUrl}/message/sendText/${config.instanceName}`;
        const cleanPhone = appt.client_phone.replace(/\D/g, "");

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
                'apikey': config.apiKey, 
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