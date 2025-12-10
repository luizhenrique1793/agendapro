import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase Admin client with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time and time 2 hours from now
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // We want to target appointments happening between 1h45m and 2h15m from now
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const windowStart = new Date(twoHoursFromNow.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(twoHoursFromNow.getTime() + 15 * 60 * 1000);

    // Fetch appointments that:
    // 1. Are today
    // 2. Reminder not sent
    // 3. Status not Cancelled or Completed
    // 4. Business has auto_reminders enabled
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        client_name,
        client_phone,
        time,
        status,
        date,
        businesses!inner (name, evolution_api_config, automatic_reminders),
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
      const apptDateTime = new Date(`${appt.date}T${appt.time}:00`);
      const diffMs = apptDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Only send if it's roughly 2 hours away (e.g. between 1.5 and 2.5 hours)
      if (diffHours < 1.5 || diffHours > 2.5) {
         continue; 
      }

      const config = appt.businesses?.evolution_api_config;
      
      if (!config || !config.serverUrl || !config.apiKey || !config.instanceName || !appt.client_phone) {
        continue;
      }

      const clientFirstName = appt.client_name.split(' ')[0];
      const time = appt.time.substring(0, 5);
      const serviceName = appt.services?.name || 'serviço';
      const businessName = appt.businesses?.name || 'Barbearia';
      
      // MELHORIA: Verificar se o agendamento é para o dia seguinte
      const apptDate = new Date(appt.date);
      const todayDate = new Date(today);
      const isTomorrow = apptDate > todayDate;
      
      let timeDescription;
      if (isTomorrow) {
        timeDescription = 'amanhã';
      } else {
        timeDescription = 'hoje';
      }
      
      const message = `🔔 Lembrete Automático\n\nOlá ${clientFirstName}! Seu horário na *${businessName}* é ${timeDescription}, às *${time}*.\n\nServiço: ${serviceName}\n\nCaso não possa comparecer, por favor nos avise.`;

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
    console.error('Error in process-auto-reminders:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});