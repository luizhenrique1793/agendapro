import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para obter a data/hora atual em um fuso horário específico
const getNowInTimezone = (tz: string) => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Buscar todos os negócios com lembretes automáticos ativados
    const { data: businesses, error: bError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, evolution_api_config, reminder_config, timezone')
      .eq('automatic_reminders', true)
      .neq('evolution_api_config', null);

    if (bError) throw bError;

    const results = [];

    for (const business of businesses || []) {
      const businessTimezone = business.timezone || 'America/Sao_Paulo';
      const nowInTz = getNowInTimezone(businessTimezone);
      const todayInTz = nowInTz.toISOString().split('T')[0];
      const tomorrowInTz = new Date(nowInTz.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 2. Buscar agendamentos relevantes para este negócio (hoje e amanhã)
      const { data: appointments, error: aError } = await supabaseAdmin
        .from('appointments')
        .select('id, client_name, client_phone, date, time, services(name), professionals(name)')
        .eq('business_id', business.id)
        .eq('reminder_sent', false)
        .in('status', ['Pendente', 'Confirmado'])
        .in('date', [todayInTz, tomorrowInTz]);

      if (aError) {
        console.error(`Error fetching appointments for business ${business.id}:`, aError);
        continue;
      }

      for (const appt of appointments || []) {
        const reminderConfig = business.reminder_config || {
          same_day_enabled: true,
          previous_day_enabled: true,
          same_day_hours_before: 2,
          previous_day_time: "19:00",
          early_threshold_hour: "09:00",
        };

        const [apptYear, apptMonth, apptDay] = appt.date.split('-').map(Number);
        const [apptHours, apptMinutes] = appt.time.split(':').map(Number);
        const apptDateTime = new Date(Date.UTC(apptYear, apptMonth - 1, apptDay, apptHours, apptMinutes));

        let shouldSend = false;
        let timeDescription = '';

        // LÓGICA 1: Lembrete do Dia Anterior
        if (reminderConfig.previous_day_enabled && appt.date === tomorrowInTz) {
          const [prevDayHours, prevDayMinutes] = reminderConfig.previous_day_time.split(':').map(Number);
          const reminderTimestamp = new Date(Date.UTC(apptYear, apptMonth - 1, apptDay - 1, prevDayHours, prevDayMinutes));
          
          // Verifica se a hora atual está na janela de 5 minutos do cron job
          if (nowInTz >= reminderTimestamp && nowInTz < new Date(reminderTimestamp.getTime() + 5 * 60 * 1000)) {
            shouldSend = true;
            timeDescription = 'amanhã';
          }
        }

        // LÓGICA 2: Lembrete do Mesmo Dia
        if (!shouldSend && reminderConfig.same_day_enabled && appt.date === todayInTz) {
          const reminderTimestamp = new Date(apptDateTime.getTime() - (reminderConfig.same_day_hours_before * 60 * 60 * 1000));
          
          // Verifica se a hora atual está na janela de 5 minutos do cron job
          if (nowInTz >= reminderTimestamp && nowInTz < new Date(reminderTimestamp.getTime() + 5 * 60 * 1000)) {
            shouldSend = true;
            timeDescription = 'hoje';
          }
        }

        if (shouldSend) {
          const clientFirstName = appt.client_name.split(' ')[0];
          const time = appt.time.substring(0, 5);
          const serviceName = appt.services?.name || 'serviço';
          const proName = appt.professionals?.name ? ` com ${appt.professionals.name}` : '';
          
          const message = `🔔 Lembrete Automático\n\nOlá ${clientFirstName}! Seu horário na *${business.name}* é ${timeDescription}, às *${time}*.\n\nServiço: ${serviceName}${proName}\n\nCaso não possa comparecer, por favor nos avise.`;

          const apiConfig = business.evolution_api_config;
          const normalizedUrl = apiConfig.serverUrl.replace(/\/$/, "");
          const endpoint = `${normalizedUrl}/message/sendText/${apiConfig.instanceName}`;
          const cleanPhone = appt.client_phone.replace(/\D/g, "");

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'apikey': apiConfig.apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: cleanPhone, text: message, options: { delay: 1000 } })
          });

          if (response.ok) {
            await supabaseAdmin.from('appointments').update({ reminder_sent: true }).eq('id', appt.id);
            results.push({ id: appt.id, status: 'sent' });
          } else {
            results.push({ id: appt.id, status: 'failed', error: await response.text() });
          }
        }
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