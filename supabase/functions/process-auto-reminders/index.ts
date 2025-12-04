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
    
    // We want to target appointments happening between 1h45m and 2h15m from now
    // This allows the cron to run every 15-30 minutes and catch them.
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const windowStart = new Date(twoHoursFromNow.getTime() - 15 * 60 * 1000); // -15 min
    const windowEnd = new Date(twoHoursFromNow.getTime() + 15 * 60 * 1000);   // +15 min

    // Convert to HH:MM format for simple comparison if your time column is just text HH:MM
    // NOTE: This simple logic assumes the server time matches the business time or UTC standardization.
    // For a robust production app, you need to handle timezones per business.
    // Here we will assume basic matching for the MVP.
    
    const targetTimeStart = windowStart.toISOString().split('T')[1].substring(0, 5);
    const targetTimeEnd = windowEnd.toISOString().split('T')[1].substring(0, 5);

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
      // Basic Time Check
      // Since 'time' is a string HH:MM, we can compare string lexicographically if in same day
      // Or construct a Date object
      const apptDateTime = new Date(`${appt.date}T${appt.time}:00`); // UTC implicitly if not handled?
      // Actually, standard Date parsing without timezone assumes UTC in Deno usually, check your setup.
      // Let's rely on simple hour diff.
      
      const diffMs = apptDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Only send if it's roughly 2 hours away (e.g. between 1.5 and 2.5 hours)
      // This logic depends on the CRON frequency.
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
      
      const message = `🔔 Lembrete Automático\n\nOlá ${clientFirstName}! Seu horário na *${businessName}* é daqui a pouco, às *${time}*.\n\nServiço: ${serviceName}\n\nCaso não possa comparecer, por favor nos avise.`;

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
            // Update reminder_sent flag
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