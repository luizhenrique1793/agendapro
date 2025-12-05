import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  Clock,
  Phone,
  Instagram,
  Facebook,
  Globe,
  Star,
  Share2,
  MessageCircle,
  CreditCard,
  Copy,
  Check,
  ChevronLeft,
  Scissors,
  Map,
  Navigation
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Service, Professional, Business } from "../../types";

// Import modular components for the booking wizard
import { StepIndicator } from "./components/StepIndicator";
import { BookingStatus } from "./components/BookingStatus";
import { ProfessionalSelectionStep } from "./components/ProfessionalSelectionStep";
import { DateTimeSelectionStep } from "./components/DateTimeSelectionStep";
import { ClientDetailsStep } from "./components/ClientDetailsStep";
import { ConfirmationStep } from "./components/ConfirmationStep";

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

  // UI State
  const [copiedPhone, setCopiedPhone] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const getFilteredProfessionals = () => {
    if (!selectedService) return [];
    const linkedIds = serviceProsMap[selectedService.id];
    if (!linkedIds) return allProfessionals;
    return allProfessionals.filter(p => linkedIds.includes(p.id));
  };

  // --- Helper Data ---
  if (loadingState !== "success" || !business) {
    return <BookingStatus status={loadingState} />;
  }

  const ad = business.address_details;
  const fullAddress = ad?.street 
    ? `${ad.street}, ${ad.number}${ad.complement ? ' - ' + ad.complement : ''}, ${ad.city} - ${ad.state}`
    : business.address || "Endereço não informado";
  
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const todayWeekDay = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Mock Reviews (since we don't have them in DB yet)
  const reviews = [
    { id: 1, name: "Carlos Silva", rating: 5, text: `Atendimento impecável e corte perfeito! O ${business.name} é referência. Recomendo a todos.` },
    { id: 2, name: "João Pereira", rating: 5, text: "Ambiente super agradável e profissionais excelentes. A barba ficou nota 10." },
  ];

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
              <ProfessionalSelectionStep
                professionals={getFilteredProfessionals()}
                onSelectPro={(pro) => {
                  setSelectedPro(pro);
                  setStep(3);
                }}
                onBack={() => setStep(1)}
              />
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

  // --- Render Step 1 (Landing Page Showcase) ---
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

      {/* Hero Images Grid */}
      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[480px] bg-gray-200">
        {business.photos && business.photos.length > 0 ? (
          <div className="grid grid-cols-4 grid-rows-2 h-full gap-1 p-1">
            {/* Main Image */}
            <div className="col-span-4 md:col-span-2 row-span-2 relative overflow-hidden group">
              <img src={business.photos[0]} alt="Principal" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            {/* Side Images */}
            {business.photos.slice(1, 5).map((photo, i) => (
              <div key={i} className={`hidden md:block col-span-1 row-span-1 relative overflow-hidden group ${i === 2 && business.photos!.length === 4 ? 'row-span-2' : ''}`}>
                <img src={photo} alt={`Galeria ${i}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            ))}
            {/* Fallback pattern if only 1 photo */}
            {business.photos.length === 1 && (
               <div className="hidden md:flex col-span-2 row-span-2 items-center justify-center bg-gray-100 text-gray-400">
                  <span className="flex items-center gap-2"><Share2 className="h-5 w-5" /> Mais fotos em breve</span>
               </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-200 to-slate-200 flex items-center justify-center text-gray-400">
            <span className="flex items-center gap-2"><Share2 className="h-8 w-8" /> Sem fotos disponíveis</span>
          </div>
        )}
      </div>

      {/* Floating Business Card */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-16 sm:-mt-20 mb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              {business.name}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl">
              {business.description || "Corte de cabelo e barba com estilo e tradição."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button 
                onClick={() => {
                    navigator.share?.({ title: business.name, url: window.location.href }).catch(() => {});
                }}
                className="flex-1 md:flex-none items-center justify-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex gap-2"
            >
              <Share2 className="h-5 w-5" /> Compartilhar
            </button>
            <a 
                href="#services"
                className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors text-center"
            >
              Agendar agora
            </a>
          </div>
        </div>
      </div>

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

            {/* Services Section */}
            <section id="services" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Serviços Disponíveis</h2>
              <div className="grid gap-4">
                {services.map((service) => (
                  <div key={service.id} className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {service.duration} min
                      </p>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                      <span className="font-bold text-lg text-gray-900 whitespace-nowrap">
                        R$ {service.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleServiceSelect(service)}
                        className="px-6 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold rounded-lg text-sm transition-colors whitespace-nowrap"
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Nenhum serviço cadastrado ainda.</p>
                    </div>
                )}
              </div>
            </section>

            {/* Reviews Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">O que nossos clientes dizem</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{review.name}</p>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm italic">"{review.text}"</p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Location Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Localização e Contato</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">{fullAddress}</span>
                </div>
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary-600 shrink-0" />
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-sm">{business.phone}</span>
                        <button onClick={() => copyToClipboard(business.phone!)} className="text-gray-400 hover:text-green-500" title="Copiar">
                            {copiedPhone ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                    </div>
                  </div>
                )}
                {business.secondary_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary-600 shrink-0" />
                    <span className="text-gray-600 text-sm">{business.secondary_phone}</span>
                  </div>
                )}
              </div>

              <a 
                href={googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors gap-2"
              >
                <Map className="h-4 w-4" /> Ver no Mapa
              </a>
            </div>

            {/* Hours Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Horário de Funcionamento</h3>
              <ul className="space-y-3 text-sm">
                {(business.working_hours || []).map((day) => {
                    const isToday = capitalize(todayWeekDay).includes(day.day);
                    return (
                        <li key={day.day} className={`flex justify-between items-center ${isToday ? "font-bold text-gray-900 bg-gray-50 p-2 -mx-2 rounded-lg" : "text-gray-600"}`}>
                            <span>{day.day}</span>
                            <span className={isToday ? "text-primary-700" : ""}>
                                {day.active && day.intervals.length > 0 
                                    ? `${day.intervals[0].start} - ${day.intervals[day.intervals.length - 1].end}` 
                                    : "Fechado"}
                            </span>
                        </li>
                    );
                })}
              </ul>
            </div>

            {/* Payments Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Pagamento</h3>
                <div className="flex flex-col gap-3">
                    {business.payment_methods && business.payment_methods.length > 0 ? (
                        business.payment_methods.map(method => (
                            <div key={method} className="flex items-center gap-3 text-sm text-gray-600">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                {method}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic">Não informado</p>
                    )}
                </div>
            </div>

            {/* Social Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Redes Sociais</h3>
                <div className="flex gap-4">
                    {business.social_media?.instagram && (
                        <a href={business.social_media.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                            <Instagram className="h-6 w-6" />
                        </a>
                    )}
                    {business.social_media?.facebook && (
                        <a href={business.social_media.facebook} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Facebook className="h-6 w-6" />
                        </a>
                    )}
                    {business.social_media?.whatsapp && (
                        <a href={business.social_media.whatsapp} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                            <MessageCircle className="h-6 w-6" />
                        </a>
                    )}
                    {business.social_media?.website && (
                        <a href={business.social_media.website} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-800 transition-colors">
                            <Globe className="h-6 w-6" />
                        </a>
                    )}
                </div>
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