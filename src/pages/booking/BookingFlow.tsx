import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  Clock,
  CheckCircle2,
  User,
  Scissors,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Service, Professional, AppointmentStatus, Business } from "../../types";

const BookingFlow: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // State for data fetched based on slug
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingState, setLoadingState] = useState<"loading" | "success" | "error">("loading");

  // State for the booking process steps
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientData, setClientData] = useState({ name: "", phone: "", email: "" });

  // State for availability
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!slug) {
        setLoadingState("error");
        return;
      }

      setLoadingState("loading");
      setStep(1);
      setSelectedService(null);
      setSelectedPro(null);
      setSelectedDate("");
      setSelectedTime("");
      setClientData({ name: "", phone: "", email: "" });

      try {
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("slug", slug)
          .single();

        if (businessError || !businessData) throw new Error("Business not found");
        setBusiness(businessData);

        const { data: servicesData } = await supabase
          .from("services")
          .select("*")
          .eq("business_id", businessData.id);
        setServices(servicesData || []);

        const { data: prosData } = await supabase
          .from("professionals")
          .select("*")
          .eq("business_id", businessData.id);
        setProfessionals(prosData || []);

        setLoadingState("success");
      } catch (error) {
        console.error("Error fetching booking data:", error);
        setLoadingState("error");
      }
    };

    fetchBusinessData();
  }, [slug]);

  // Effect to calculate available slots when dependencies change
  useEffect(() => {
    const calculateAvailableSlots = async () => {
      if (!selectedDate || !selectedPro || !selectedService) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setSelectedTime(""); // Reset time when date changes

      try {
        // 1. Get professional's schedule for the selected day of the week
        const dateObj = new Date(`${selectedDate}T00:00:00`); // Avoid timezone issues
        const dayOfWeekIndex = dateObj.getDay();
        const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        const dayName = dayNames[dayOfWeekIndex];
        
        const proSchedule = selectedPro.schedule?.find(s => s.day === dayName);

        if (!proSchedule || !proSchedule.active || proSchedule.intervals.length === 0) {
          setAvailableSlots([]);
          setLoadingSlots(false);
          return;
        }

        // 2. Fetch existing appointments and blocks for that day
        const { data: appointments } = await supabase
          .from("appointments")
          .select("time, service_id(duration)")
          .eq("professional_id", selectedPro.id)
          .eq("date", selectedDate);

        const { data: blocks } = await supabase
          .from("professional_blocks")
          .select("start_time, end_time")
          .eq("professional_id", selectedPro.id)
          .lte("start_date", selectedDate)
          .gte("end_date", selectedDate);

        // Helper to convert HH:mm to minutes from midnight
        const timeToMinutes = (time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        // Create a list of all booked time ranges in minutes
        const bookedRanges = (appointments || []).map((a: any) => {
          const start = timeToMinutes(a.time);
          const end = start + a.service_id.duration;
          return { start, end };
        });

        (blocks || []).forEach(b => {
            // If a block is for the whole day
            if (!b.start_time || !b.end_time) {
                bookedRanges.push({ start: 0, end: 24 * 60 });
            } else {
                bookedRanges.push({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) });
            }
        });

        // 3. Generate potential slots and check for availability
        const potentialSlots: string[] = [];
        const serviceDuration = selectedService.duration;
        const slotInterval = 15; // Check for a slot every 15 minutes

        proSchedule.intervals.forEach(interval => {
          let currentMinute = timeToMinutes(interval.start);
          const endMinute = timeToMinutes(interval.end);

          while (currentMinute + serviceDuration <= endMinute) {
            const slotStart = currentMinute;
            const slotEnd = currentMinute + serviceDuration;

            // Check for overlap with any booked range
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

        setAvailableSlots(potentialSlots);

      } catch (error) {
        console.error("Error calculating slots:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    calculateAvailableSlots();
  }, [selectedDate, selectedPro, selectedService]);


  const handleBooking = async () => {
    if (selectedService && selectedPro && business) {
      try {
        const { error } = await supabase.from("appointments").insert([
          {
            clientName: clientData.name,
            clientPhone: clientData.phone,
            serviceId: selectedService.id,
            professionalId: selectedPro.id,
            date: selectedDate,
            time: selectedTime,
            status: AppointmentStatus.PENDING,
            business_id: business.id,
            clientId: "guest-client", // Placeholder for guest bookings
          },
        ]);

        if (error) throw error;

        setStep(5);
      } catch (error) {
        console.error("Error booking appointment:", error);
        alert("Erro ao realizar agendamento. Tente novamente.");
      }
    }
  };

  if (loadingState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600">Carregando informações do negócio...</p>
        </div>
      </div>
    );
  }

  if (loadingState === "error" || !business) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-center">
        <div>
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Negócio não encontrado</h2>
          <p className="mt-2 text-gray-600">
            O link de agendamento parece estar incorreto.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">AgendaPro</span>
          </Link>
          <span className="text-sm font-semibold text-gray-700">{business.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${step >= i
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-500"
                  }`}
              >
                {i}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-1 text-xs text-gray-500">
            <span>Serviço</span>
            <span>Profissional</span>
            <span>Data/Hora</span>
            <span>Dados</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Selecione um serviço
              </h2>
              <div className="grid gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition-all hover:border-primary-500 hover:bg-primary-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Scissors className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {service.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {service.duration} minutos
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setStep(1)}
                className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-900"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </button>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Escolha o profissional
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {professionals.map((pro) => (
                  <button
                    key={pro.id}
                    onClick={() => {
                      setSelectedPro(pro);
                      setStep(3);
                    }}
                    className="flex flex-col items-center rounded-xl border border-gray-200 p-6 text-center transition-all hover:border-primary-500 hover:bg-primary-50"
                  >
                    <img
                      src={pro.avatarUrl}
                      alt={pro.name}
                      className="mb-4 h-20 w-20 rounded-full object-cover"
                    />
                    <h3 className="font-semibold text-gray-900">{pro.name}</h3>
                    <p className="text-sm text-gray-500">{pro.role}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setStep(2)}
                className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-900"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </button>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Data e Horário
              </h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Selecione a data
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Horários disponíveis
                  </label>
                  {loadingSlots ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    </div>
                  ) : selectedDate && availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-lg py-2 text-sm font-medium transition-colors ${selectedTime === time
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : selectedDate ? (
                    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        Nenhum horário disponível.
                      </p>
                      <p className="text-xs text-gray-500">
                        Por favor, selecione outra data.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 text-center">
                      <p className="text-sm text-gray-500">
                        Selecione uma data para ver os horários.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedDate || !selectedTime}
                  className="rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setStep(3)}
                className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-900"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </button>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Seus Dados
              </h2>

              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">Resumo</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Serviço:</span> {selectedService?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Profissional:</span> {selectedPro?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Data:</span> {selectedDate} às {selectedTime}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total:</span> R$ {selectedService?.price.toFixed(2)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome Completo
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={clientData.name}
                      onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                      className="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleBooking}
                  disabled={!clientData.name || !clientData.phone}
                  className="rounded-lg bg-primary-600 px-8 py-3 font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Agendamento Confirmado!
              </h2>
              <p className="text-gray-600">
                Obrigado, {clientData.name}. Enviamos a confirmação para seu telefone.
              </p>
              <div className="mt-8">
                <Link
                  to="/"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Voltar ao início
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookingFlow;