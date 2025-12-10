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

    // Get current time and time 2 hours from now
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Buscar agendamentos que podem precisar de lembretes hoje
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        client_name,
        client_phone,
        time,
        status,
        date,
        businesses!inner (
          id,
          name, 
          evolution_api_config, 
          automatic_reminders,
          reminder_config
        ),
        services (name),
        professionals (name)
      `)
      .eq('date', today)
      .eq('reminder_sent', false)
      .neq('status', 'Cancelado')
      .neq('status', 'Concluído')
      .eq('businesses.automatic_reminders', true);

    if (error) throw error;

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

      const apptDateTime = new Date(`${appt.date}T${appt.time}:00`);
      const apptHour = parseInt(appt.time.split(':')[0]);
      const earlyThreshold = parseInt(reminderConfig.early_threshold_hour.split(':')[0]);
      
      // Determinar se deve enviar lembrete baseado na configuração
      let shouldSendReminder = false;
      let timeDescription = 'hoje';
      
      if (reminderConfig.previous_day_enabled && apptHour < earlyThreshold) {
        // Para agendamentos muito cedo, verificar se estamos no horário correto do dia anterior
        const [prevDayHours, prevDayMinutes] = reminderConfig.previous_day_time.split(':').map(Number);
        const prevDayReminderTime = new Date(now);
        prevDayReminderTime.setHours(prevDayHours, prevDayMinutes, 0, 0);
        
        // Verificar se estamos dentro de uma janela de 30 minutos do horário configurado
        const timeDiff = Math.abs(now.getTime() - prevDayReminderTime.getTime());
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (timeDiff <= thirtyMinutes) {
          shouldSendReminder = true;
          timeDescription = 'amanhã';
        }
      } else if (reminderConfig.same_day_enabled) {
        // Para agendamentos no mesmo dia, verificar se estamos X horas antes
        const reminderTime = new Date(apptDateTime.getTime() - reminderConfig.same_day_hours_before * 60 * 60 * 1000);
        const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
        const fifteenMinutes = 15 * 60 * 1000; // Janela de 15 minutos
        
        if (timeDiff <= fifteenMinutes) {
          shouldSendReminder = true;
        }
      }

      if (!shouldSendReminder) {
        continue;
      }

      const clientFirstName = appt.client_name.split(' ')[0];
      const time = appt.time.substring(0, 5);
      const serviceName = appt.services?.name || 'serviço';
      const businessName = appt.businesses?.name || 'Barbearia';
      const proName = appt.professionals?.name ? ` com ${appt.professionals.name}` : '';
      
      const message = `🔔 Lembrete Automático\n\nOlá ${clientFirstName}! Seu horário na *${businessName}* é ${timeDescription}, às *${time}*.\n\nServiço: ${serviceName}${proName}\n\nCaso não possa comparecer, por favor nos avise.`;

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
            await supabaseAdmin
                .from('appointments')
                .update({ reminder_sent: true })
                .eq('id', appt.id);
            
            results.push({ id: appt.id, status: 'sent' });
        } else {
            results.push({ id: appt.id, status: 'failed' });
        }
      } catch (e) {
        console.error(e);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
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