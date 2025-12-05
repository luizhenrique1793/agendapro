import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Scissors } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Service, Professional, Business } from "../../types";

// Import modular components
import { StepIndicator } from "./components/StepIndicator";
import { BookingStatus } from "./components/BookingStatus";
import { ProfessionalSelectionStep } from "./components/ProfessionalSelectionStep";
import { DateTimeSelectionStep } from "./components/DateTimeSelectionStep";
import { ClientDetailsStep } from "./components/ClientDetailsStep";
import { ConfirmationStep } from "./components/ConfirmationStep";
import { BusinessHero } from "./components/BusinessHero";
import { BusinessInfoSidebar } from "./components/BusinessInfoSidebar";
import { ServiceList } from "./components/ServiceList";
import { ReviewsSection } from "./components/ReviewsSection";

const BookingFlow: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // Data State
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  const [serviceProsMap, setServiceProsMap] = useState<Record<string, string[]>>({});
  const [loadingState, setLoadingState] = useState<"loading" | "success" | "error">("loading");

  // Booking Flow State
  const [step, setStep] = useState(1); // 1 = Landing/Services, 2 = Pros, 3 = Date, 4 = Client, 5 = Confirm
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientData, setClientData] = useState({ name: "", phone: "", email: "" });

  // Availability State
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!slug) {
        setLoadingState("error");
        return;
      }

      setLoadingState("loading");
      // Reset booking state
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
          .eq("business_id", businessData.id)
          .order("name");
        setServices(servicesData || []);

        const { data: prosData } = await supabase
          .from("professionals")
          .select("*")
          .eq("business_id", businessData.id);
        setAllProfessionals(prosData || []);

        const { data: relData } = await supabase
          .from("service_professionals")
          .select("service_id, professional_id")
          .eq("business_id", businessData.id);

        const map: Record<string, string[]> = {};
        if (relData) {
          relData.forEach((item) => {
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

  // --- Availability Calculation ---
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

  // --- Handlers ---
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2); // Move to Professional selection
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const getFilteredProfessionals = () => {
    if (!selectedService) return [];
    const linkedIds = serviceProsMap[selectedService.id];
    if (!linkedIds) return allProfessionals;
    return allProfessionals.filter(p => linkedIds.includes(p.id));
  };

  if (loadingState !== "success" || !business) {
    return <BookingStatus status={loadingState} />;
  }

  // --- Render Steps > 1 (Wizard Mode) ---
  if (step > 1) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
             <button onClick={() => setStep(step - 1)} className="text-gray-500 hover:text-primary-600 flex items-center gap-1 text-sm font-medium">
                <ChevronLeft className="h-4 w-4" /> Voltar
             </button>
             <span className="font-bold text-gray-900">{business.name}</span>
             <div className="w-16"></div> {/* Spacer for center alignment */}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <StepIndicator currentStep={step} />
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {step === 2 && (
              <div className="p-6 sm:p-8">
                  {getFilteredProfessionals().length > 0 ? (
                      <ProfessionalSelectionStep 
                          professionals={getFilteredProfessionals()} 
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
            )}
            {step === 3 && (
              <DateTimeSelectionStep
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                availableSlots={availableSlots}
                loadingSlots={loadingSlots}
                onDateChange={setSelectedDate}
                onTimeSelect={setSelectedTime}
                onBack={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            )}
            {step === 4 && (
              <ClientDetailsStep
                selectedService={selectedService}
                selectedPro={selectedPro}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                clientData={clientData}
                onClientDataChange={(field, value) => setClientData(prev => ({ ...prev, [field]: value }))}
                onBack={() => setStep(3)}
                onBook={handleBooking}
              />
            )}
            {step === 5 && (
              <ConfirmationStep clientName={clientData.name} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Render Step 1 (Showcase) ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      
      {/* Header / Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">AgendaPro</span>
          </div>
          <Link to="/login" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            Área do Profissional
          </Link>
        </div>
      </header>

      <BusinessHero business={business} />

      {/* Main Content Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Main) */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre a {business.type || "Barbearia"}</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {business.description || `Bem-vindo à ${business.name}. Oferecemos serviços de alta qualidade com profissionais experientes. Venha nos visitar e tenha uma experiência única.`}
              </p>
            </section>

            <ServiceList services={services} onSelectService={handleServiceSelect} />
            
            <ReviewsSection />

          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1">
             <div className="sticky top-4">
                <BusinessInfoSidebar business={business} />
             </div>
          </div>
        </div>
      </div>

      {/* Footer Simple */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} AgendaPro - Agendamento Online Simplificado</p>
      </footer>

    </div>
  );
};

export default BookingFlow;