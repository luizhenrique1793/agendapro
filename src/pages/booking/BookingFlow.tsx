import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Service, Professional, AppointmentStatus, Business } from "../../types";

// Import modular components
import { StepIndicator } from "./components/StepIndicator";
import { BookingStatus } from "./components/BookingStatus";
import { ServiceSelectionStep } from "./components/ServiceSelectionStep";
import { ProfessionalSelectionStep } from "./components/ProfessionalSelectionStep";
import { DateTimeSelectionStep } from "./components/DateTimeSelectionStep";
import { ClientDetailsStep } from "./components/ClientDetailsStep";
import { ConfirmationStep } from "./components/ConfirmationStep";

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

  useEffect(() => {
    const calculateAvailableSlots = async () => {
      if (!selectedDate || !selectedPro || !selectedService) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setSelectedTime("");

      try {
        // Use a more robust way to create a local date object from YYYY-MM-DD string
        const [year, month, day] = selectedDate.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);

        const dayOfWeekIndex = dateObj.getDay();
        const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        const dayName = dayNames[dayOfWeekIndex];
        
        const proSchedule = selectedPro.schedule?.find(s => s.day === dayName);

        if (!proSchedule || !proSchedule.active || proSchedule.intervals.length === 0) {
          setAvailableSlots([]);
          setLoadingSlots(false);
          return;
        }

        const { data: appointments } = await supabase
          .from("appointments")
          .select("time, services(duration)")
          .eq("professional_id", selectedPro.id)
          .eq("date", selectedDate);

        const { data: blocks } = await supabase
          .from("professional_blocks")
          .select("start_time, end_time")
          .eq("professional_id", selectedPro.id)
          .lte("start_date", selectedDate)
          .gte("end_date", selectedDate);

        const timeToMinutes = (time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const bookedRanges = (appointments || []).map((a: any) => {
          const start = timeToMinutes(a.time);
          const end = start + (a.services?.duration || 30);
          return { start, end };
        });

        (blocks || []).forEach(b => {
            if (!b.start_time || !b.end_time) {
                bookedRanges.push({ start: 0, end: 24 * 60 });
            } else {
                bookedRanges.push({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) });
            }
        });

        const potentialSlots: string[] = [];
        const serviceDuration = selectedService.duration;
        const slotInterval = 15;

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
            client_name: clientData.name,
            client_phone: clientData.phone,
            service_id: selectedService.id,
            professional_id: selectedPro.id,
            date: selectedDate,
            time: selectedTime,
            status: AppointmentStatus.PENDING,
            business_id: business.id,
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

  if (loadingState !== "success" || !business) {
    return <BookingStatus status={loadingState} />;
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ServiceSelectionStep services={services} onSelectService={(service) => {
          setSelectedService(service);
          setStep(2);
        }} />;
      case 2:
        return <ProfessionalSelectionStep professionals={professionals} onSelectPro={(pro) => {
          setSelectedPro(pro);
          setStep(3);
        }} onBack={() => setStep(1)} />;
      case 3:
        return <DateTimeSelectionStep 
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          availableSlots={availableSlots}
          loadingSlots={loadingSlots}
          onDateChange={setSelectedDate}
          onTimeSelect={setSelectedTime}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />;
      case 4:
        return <ClientDetailsStep
          selectedService={selectedService}
          selectedPro={selectedPro}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          clientData={clientData}
          onClientDataChange={(field, value) => setClientData(prev => ({ ...prev, [field]: value }))}
          onBack={() => setStep(3)}
          onBook={handleBooking}
        />;
      case 5:
        return <ConfirmationStep clientName={clientData.name} />;
      default:
        return <ServiceSelectionStep services={services} onSelectService={(service) => {
          setSelectedService(service);
          setStep(2);
        }} />;
    }
  };

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
        {step < 5 && <StepIndicator currentStep={step} />}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

export default BookingFlow;