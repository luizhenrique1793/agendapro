import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Lidar com solicitação de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { professional_id, service_id, date, business_id } = await req.json();

    if (!professional_id || !service_id || !date || !business_id) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios faltando' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Buscar duração do serviço
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('duration')
      .eq('id', service_id)
      .single();
    if (serviceError) throw serviceError;
    const serviceDuration = serviceData.duration;

    // 2. Buscar agenda do profissional para o dia especificado
    // Nota: O formato da data recebida é esperado como YYYY-MM-DD
    // Precisamos garantir que o dia da semana seja calculado corretamente
    const dateParts = date.split('-').map(Number);
    // Criar data usando construtor UTC para evitar problemas de fuso na extração do dia da semana
    const dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
    const dayOfWeekIndex = dateObj.getUTCDay(); // 0 = Domingo, etc.
    
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const dayName = dayNames[dayOfWeekIndex];

    const { data: proData, error: proError } = await supabase
      .from('professionals')
      .select('schedule')
      .eq('id', professional_id)
      .single();
    if (proError) throw proError;

    const proSchedule = proData.schedule?.find((s: any) => s.day === dayName);
    
    // Se não houver agenda, ou dia inativo, ou sem intervalos, retorna vazio
    if (!proSchedule || !proSchedule.active || !proSchedule.intervals || proSchedule.intervals.length === 0) {
      return new Response(JSON.stringify({ availableSlots: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Buscar agendamentos existentes e bloqueios
    const { data: appointments } = await supabase
      .from('appointments')
      .select('time, services(duration)')
      .eq('professional_id', professional_id)
      .eq('date', date)
      .neq('status', 'Cancelado'); // Ignorar cancelados

    const { data: blocks } = await supabase
      .from('professional_blocks')
      .select('start_time, end_time')
      .eq('professional_id', professional_id)
      .lte('start_date', date)
      .gte('end_date', date);

    // 4. Calcular slots disponíveis
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Mapear horários ocupados (agendamentos)
    const bookedRanges = (appointments || []).map((a: any) => {
      const start = timeToMinutes(a.time);
      const duration = a.services?.duration || 30;
      const end = start + duration;
      return { start, end };
    });

    // Mapear bloqueios
    (blocks || []).forEach((b: any) => {
      if (!b.start_time || !b.end_time) {
        // Bloqueio de dia inteiro
        bookedRanges.push({ start: 0, end: 24 * 60 });
      } else {
        bookedRanges.push({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) });
      }
    });

    const potentialSlots: string[] = [];
    
    // Regra 1: Slot fixo de 30 minutos
    const slotInterval = 30;

    // Obter hora atual em minutos para Regra 5 (Não mostrar passado)
    // Ajustando para Fuso Horário Brasil (UTC-3) aproximadamente para comparação simples
    const now = new Date();
    // Subtrai 3 horas do UTC
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const nowISO = brazilTime.toISOString().split('T')[0]; // YYYY-MM-DD no Brasil
    const currentMinutesOfDay = brazilTime.getUTCHours() * 60 + brazilTime.getUTCMinutes();
    
    const isToday = date === nowISO;

    proSchedule.intervals.forEach((interval: any) => {
      let intervalStart = timeToMinutes(interval.start);
      const intervalEnd = timeToMinutes(interval.end);

      // Regra 3: Alinhar início ao slot de 30 minutos
      // Se 09:10 -> arredonda para 09:30
      if (intervalStart % slotInterval !== 0) {
        intervalStart += (slotInterval - (intervalStart % slotInterval));
      }

      let currentSlotStart = intervalStart;

      // Regra 4: Gerar horários candidatos
      while (currentSlotStart + serviceDuration <= intervalEnd) {
        const currentSlotEnd = currentSlotStart + serviceDuration;

        // Regra 5: Verificar se é horário passado (se for hoje)
        if (isToday && currentSlotStart <= currentMinutesOfDay) {
             currentSlotStart += slotInterval;
             continue;
        }

        // Verificar conflito com agendamentos e bloqueios
        // Existe conflito se (SlotStart < RangeEnd) E (SlotEnd > RangeStart)
        const isOverlapping = bookedRanges.some(range => 
          currentSlotStart < range.end && currentSlotEnd > range.start
        );

        if (!isOverlapping) {
          // Formatar para HH:MM
          const hours = Math.floor(currentSlotStart / 60).toString().padStart(2, '0');
          const minutes = (currentSlotStart % 60).toString().padStart(2, '0');
          potentialSlots.push(`${hours}:${minutes}`);
        }

        // Avançar para o próximo slot candidato
        currentSlotStart += slotInterval;
      }
    });

    // Retornar no formato original (Regra 6)
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