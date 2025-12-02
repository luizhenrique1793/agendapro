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
    const { professional_id, service_id, date, business_id } = await req.json();

    if (!professional_id || !service_id || !date || !business_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Fetch service duration
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('duration')
      .eq('id', service_id)
      .single();
    if (serviceError) throw serviceError;
    const serviceDuration = serviceData.duration;

    // 2. Fetch professional's schedule for the given day
    const dateObj = new Date(date.replace(/-/g, '/'));
    const dayOfWeekIndex = dateObj.getDay();
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const dayName = dayNames[dayOfWeekIndex];

    const { data: proData, error: proError } = await supabase
      .from('professionals')
      .select('schedule')
      .eq('id', professional_id)
      .single();
    if (proError) throw proError;

    const proSchedule = proData.schedule?.find(s => s.day === dayName);
    if (!proSchedule || !proSchedule.active || proSchedule.intervals.length === 0) {
      return new Response(JSON.stringify({ availableSlots: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Fetch existing appointments and blocks
    const { data: appointments } = await supabase
      .from('appointments')
      .select('time, services(duration)')
      .eq('professional_id', professional_id)
      .eq('date', date);

    const { data: blocks } = await supabase
      .from('professional_blocks')
      .select('start_time, end_time')
      .eq('professional_id', professional_id)
      .lte('start_date', date)
      .gte('end_date', date);

    // 4. Calculate available slots (logic from BookingFlow.tsx)
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const bookedRanges = (appointments || []).map((a) => {
      const start = timeToMinutes(a.time);
      const end = start + (a.services?.duration || 30);
      return { start, end };
    });

    (blocks || []).forEach(b => {
      if (!b.start_time || !b.end_time) {
        bookedRanges.push({ start: 0, end: 24 * 60 }); // Full day block
      } else {
        bookedRanges.push({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) });
      }
    });

    const potentialSlots = [];
    const slotInterval = 15; // Check every 15 minutes

    proSchedule.intervals.forEach(interval => {
      let currentMinute = timeToMinutes(interval.start);
      const endMinute = timeToMinutes(interval.end);

      while (currentMinute + serviceDuration <= endMinute) {
        const slotStart = currentMinute;
        const slotEnd = currentMinute + serviceDuration;

        const isOverlapping = bookedRanges.some(range =>
          slotStart < range.end && slotEnd > range.start
        );

        if (!isOverlapping) {
          const hours = Math.floor(slotStart / 60).toString().padStart(2, '0');
          const minutes = (slotStart % 60).toString().padStart(2, '0');
          potentialSlots.push(`${hours}:${minutes}`);
        }
        currentMinute += slotInterval;
      }
    });

    return new Response(JSON.stringify({ availableSlots: potentialSlots }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});