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

    // Obter hora atual e janela de processamento (2 horas antes até 15 minutos depois)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Janela: lembretes que deveriam ter sido enviados entre 2h15min atrás e 15min no futuro
    const windowStart = new Date(now.getTime() - (2 * 60 * 60 * 1000) - (15 * 60 * 1000));
    const windowEnd = new Date(now.getTime() + (15 * 60 * 1000));

    // Buscar agendamentos que precisam de lembretes hoje
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
          automatic_reminders,
          reminder_config,
          evolution_api_config
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
      const business = appt.businesses;
      
      // Verificar se o negócio tem WhatsApp configurado
      if (!business?.evolution_api_config?.serverUrl || 
          !business.evolution_api_config.apiKey || 
          !business.evolution_api_config.instanceName || 
          !appt.client_phone) {
        results.push({ id: appt.id, status: 'skipped', reason: 'no_whatsapp_config' });
        continue;
      }

      // Calcular quando o lembrete deveria ser enviado baseado na configuração do negócio
      const reminderConfig = business.reminder_config || {
        same_day_enabled: true,
        same_day_hours_before: 2,
        previous_day_enabled: true,
        early_threshold_hour: "09:00",
        previous_day_time: "19:00"
      };

      const apptDateTime = new Date(`${appt.date}T${appt.time}:00`);
      const apptHour = appt.time.substring(0, 5); // HH:MM
      
      let sendAt: Date;

      // Se lembretes no mesmo dia estão desabilitados, pular
      if (!reminderConfig.same_day_enabled) {
        results.push({ id: appt.id, status: 'skipped', reason: 'same_day_disabled' });
        continue;
      }

      // Verificar se o horário do agendamento é considerado "muito cedo"
      // Se for muito cedo E o ajuste para dia anterior estiver habilitado
      const isEarlyAppointment = apptHour < reminderConfig.early_threshold_hour;
      
      if (isEarlyAppointment && reminderConfig.previous_day_enabled) {
        // Regra: Enviar no dia anterior no horário configurado
        // Como estamos processando lembretes do dia atual, isso significa
        // que o lembrete deveria ter sido enviado ontem no horário previous_day_time
        const previousDay = new Date(apptDateTime);
        previousDay.setDate(previousDay.getDate() - 1);
        
        const [hours, minutes] = reminderConfig.previous_day_time.split(':');
        previousDay.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        sendAt = previousDay;
      } else {
        // Regra: Enviar no mesmo dia, X horas antes do agendamento
        sendAt = new Date(apptDateTime.getTime() - reminderConfig.same_day_hours_before * 60 * 60 * 1000);
      }

      // Verificar se está dentro da janela de processamento
      if (sendAt < windowStart || sendAt > windowEnd) {
        results.push({ id: appt.id, status: 'skipped', reason: 'outside_window', sendAt: sendAt.toISOString() });
        continue;
      }

      // Preparar mensagem
      const clientFirstName = appt.client_name.split(' ')[0];
      const time = appt.time.substring(0, 5);
      const serviceName = appt.services?.name || 'serviço';
      const businessName = business.name;
      const proName = appt.professionals?.name ? ` com ${appt.professionals.name}` : '';
      
      const message = `🔔 Lembrete Automático\n\nOlá ${clientFirstName}! Seu horário na *${businessName}* é hoje, às *${time}*.\n\nServiço: ${serviceName}${proName}\n\nEstamos te esperando! 😉`;

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
            await supabaseAdmin
                .from('appointments')
                .update({ reminder_sent: true })
                .eq('id', appt.id);
            
            results.push({ id: appt.id, status: 'sent', sendAt: sendAt.toISOString() });
        } else {
            results.push({ id: appt.id, status: 'failed', error: `HTTP ${response.status}` });
        }
      } catch (e) {
        console.error(`Failed to send to ${appt.id}`, e);
        results.push({ id: appt.id, status: 'failed', error: e.message });
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