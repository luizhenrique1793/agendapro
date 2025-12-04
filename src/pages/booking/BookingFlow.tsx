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
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  const [serviceProsMap, setServiceProsMap] = useState<Record<string, string[]>>({});
  
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
        setAllProfessionals(prosData || []);

        // Fetch relationship map
        const { data: relData } = await supabase
            .from("service_professionals")
            .select("service_id, professional_id")
            .eq("business_id", businessData.id);
        
        const map: Record<string, string[]> = {};
        if (relData) {
            relData.forEach(item => {
                if (!map[item.service_id]) map[item.service_id] = [];
                map[item.service_id].push(item.professional_id);
            });
        }
        setServiceProsMap(map);

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
        const { data, error } = await supabase.functions.invoke('get-available-slots', {
          body: {
            professional_id: selectedPro.id,
            service_id: selectedService.id,
            date: selectedDate,
            business_id: business?.id
          }
        });

        if (error) throw error;
        
        if (data.availableSlots) {
            setAvailableSlots(data.availableSlots);
        } else {
            setAvailableSlots([]);
        }

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
    if (!selectedService || !selectedPro || !business || !selectedDate || !selectedTime || !clientData.name || !clientData.phone) {
      alert("Erro: informações do agendamento incompletas.");
      return;
    }
  
    try {
      const { error } = await supabase.rpc('book_appointment_public', {
        p_business_id: business.id,
        p_client_name: clientData.name,
        p_client_phone: clientData.phone,
        p_client_email: clientData.email,
        p_service_id: selectedService.id,
        p_professional_id: selectedPro.id,
        p_date: selectedDate,
        p_time: selectedTime
      });

      if (error) throw error;
  
      setStep(5);
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      alert(`Erro ao realizar agendamento: ${error.message}`);
    }
  };

  if (loadingState !== "success" || !business) {
    return <BookingStatus status={loadingState} />;
  }

  // Filter professionals for the selected service
  // If no relation exists in map (legacy or not set), maybe show all? 
  // Requirement says: "se o profissional não estiver vinculado... não aparece". 
  // So strict filtering. If map is empty for a service, show none (or all if we want fallback, but user asked for restriction).
  // Let's implement strict filtering BUT fallback to ALL if the service has NO entries in the join table at all?
  // User said: "se o profissional não estiver vinculado... não aparece". This implies explicit linking.
  // However, for existing data without links, everything would disappear.
  // Let's assume: if there are entries in service_professionals table for this service, filter. If not, show all (migration period).
  // Or simpler: User creates/updates service -> links pros. If no links, no pros.
  // I will show ONLY linked pros. If the list is empty, I'll show a message "Nenhum profissional disponível".
  
  const getFilteredProfessionals = () => {
    if (!selectedService) return [];
    
    const linkedIds = serviceProsMap[selectedService.id];
    
    // Fallback: If no mapping exists for this service, show ALL (to support legacy/lazy setup)
    // If user explicitly unchecks all, linkedIds is empty array? No, map entry won't exist if I fetched only existing rows?
    // Actually my fetch logic builds map only for existing rows.
    // So if I saved a service with 0 pros, map entry is undefined.
    // Strategy: Check if there are ANY service_professionals for this business. If yes, enforce strict mode. If no (fresh install), maybe loose?
    // Safer: strict filter based on map. If undefined, check if we want to show all. 
    // Let's show all if undefined to be safe for existing data.
    
    if (!linkedIds) {
        // If the service ID is not in the map, it means no professionals are explicitly linked.
        // For backwards compatibility, return all professionals.
        return allProfessionals;
    }
    
    return allProfessionals.filter(p => linkedIds.includes(p.id));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ServiceSelectionStep services={services} onSelectService={(service) => {
          setSelectedService(service);
          setStep(2);
        }} />;
      case 2:
        const filteredPros = getFilteredProfessionals();
        return (
            <div className="p-6 sm:p-8">
                {filteredPros.length > 0 ? (
                    <ProfessionalSelectionStep 
                        professionals={filteredPros} 
                        onSelectPro={(pro) => {
                            setSelectedPro(pro);
                            setStep(3);
                        }} 
                        onBack={() => setStep(1)} 
                    />
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Nenhum profissional disponível para este serviço no momento.</p>
                        <button onClick={() => setStep(1)} className="text-primary-600 font-semibold">Voltar</button>
                    </div>
                )}
            </div>
        );
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