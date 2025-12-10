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

    // Initialize Supabase client with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { 
      global: { headers: { Authorization: req.headers.get('Authorization')! } } 
    });

    // 1. Fetch service duration
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('duration')
      .eq('id', service_id)
      .single();
    if (serviceError) throw serviceError;
    const serviceDuration = serviceData.duration;

    // 2. Fetch professional's schedule for the specified day
    // Note: The received date format is expected as YYYY-MM-DD
    // We need to ensure the day of the week is calculated correctly
    const dateParts = date.split('-').map(Number);
    // Create date using UTC constructor to avoid timezone issues when extracting day of week
    const dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
    const dayOfWeekIndex = dateObj.getUTCDay(); // 0 = Sunday, etc.
    
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const dayName = dayNames[dayOfWeekIndex];

    const { data: proData, error: proError } = await supabase
      .from('professionals')
      .select('schedule')
      .eq('id', professional_id)
      .single();
    if (proError) throw proError;

    const proSchedule = proData.schedule?.find((s: any) => s.day === dayName);
    
    // If no schedule, or day inactive, or no intervals, return empty
    if (!proSchedule || !proSchedule.active || !proSchedule.intervals || proSchedule.intervals.length === 0) {
      return new Response(JSON.stringify({ availableSlots: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Fetch existing appointments and blocks
    const { data: appointments } = await supabase
      .from('appointments')
      .select('time, services(duration)')
      .eq('professional_id', professional_id)
      .eq('date', date)
      .neq('status', 'Cancelado'); // Ignore cancelled

    const { data: blocks } = await supabase
      .from('professional_blocks')
      .select('start_time, end_time')
      .eq('professional_id', professional_id)
      .lte('start_date', date)
      .gte('end_date', date);

    // 4. Calculate available slots
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Map occupied time slots (appointments)
    const bookedRanges = (appointments || []).map((a: any) => {
      const start = timeToMinutes(a.time);
      const duration = a.services?.duration || 30;
      const end = start + duration;
      return { start, end };
    });

    // Map blocks
    (blocks || []).forEach((b: any) => {
      if (!b.start_time || !b.end_time) {
        // Full day block
        bookedRanges.push({ start: 0, end: 24 * 60 });
      } else {
        bookedRanges.push({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) });
      }
    });

    const potentialSlots: string[] = [];
    
    // Rule 1: Fixed 30-minute slot
    const slotInterval = 30;

    // Get current time in minutes for Rule 5 (Don't show past)
    // Adjusting to Brazil timezone (UTC-3) approximately for simple comparison
    const now = new Date();
    // Subtract 3 hours from UTC
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const nowISO = brazilTime.toISOString().split('T')[0]; // YYYY-MM-DD in Brazil
    const currentMinutesOfDay = brazilTime.getUTCHours() * 60 + brazilTime.getUTCMinutes();
    
    const isToday = date === nowISO;

    proSchedule.intervals.forEach((interval: any) => {
      let intervalStart = timeToMinutes(interval.start);
      const intervalEnd = timeToMinutes(interval.end);

      // Rule 3: Align start to 30-minute slot
      // If 09:10 -> round to 09:30
      if (intervalStart % slotInterval !== 0) {
        intervalStart += (slotInterval - (intervalStart % slotInterval));
      }

      let currentSlotStart = intervalStart;

      // Rule 4: Generate candidate time slots
      while (currentSlotStart + serviceDuration <= intervalEnd) {
        const currentSlotEnd = currentSlotStart + serviceDuration;

        // Rule 5: Check if it's past time (if today)
        if (isToday && currentSlotStart <= currentMinutesOfDay) {
             currentSlotStart += slotInterval;
             continue;
        }

        // Check conflict with appointments and blocks
        // There is conflict if (SlotStart < RangeEnd) AND (SlotEnd > RangeStart)
        const isOverlapping = bookedRanges.some(range => 
          currentSlotStart < range.end && currentSlotEnd > range.start
        );

        if (!isOverlapping) {
          // Format to HH:MM
          const hours = Math.floor(currentSlotStart / 60).toString().padStart(2, '0');
          const minutes = (currentSlotStart % 60).toString().padStart(2, '0');
          potentialSlots.push(`${hours}:${minutes}`);
        }

        // Move to next candidate slot
        currentSlotStart += slotInterval;
      }
    });

    // Return in original format (Rule 6)
    return new Response(JSON.stringify({ availableSlots: potentialSlots }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});