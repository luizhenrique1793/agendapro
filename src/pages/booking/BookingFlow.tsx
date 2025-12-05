import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Calendar as CalendarIcon, 
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
  Check
} from "lucide-react";
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
  
  // UI States
  const [copiedPhone, setCopiedPhone] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  if (loadingState !== "success" || !business) {
    return <BookingStatus status={loadingState} />;
  }

  const getFilteredProfessionals = () => {
    if (!selectedService) return [];
    const linkedIds = serviceProsMap[selectedService.id];
    if (!linkedIds) return allProfessionals;
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
  
  // Helpers para o Business Card
  const ad = business.address_details;
  const fullAddress = ad ? `${ad.street}, ${ad.number} - ${ad.neighborhood}, ${ad.city} - ${ad.state}` : business.address || "Endereço não informado";
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const todayWeekDay = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  
  // Capitalize first letter helper
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Business Hero & Info */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
                
                {/* Left Column: Info & Gallery */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                {business.type || "Barbearia"}
                            </span>
                            <div className="flex items-center text-yellow-400">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="ml-1 text-sm font-medium text-gray-700">5.0 (Novo)</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
                            {business.name}
                        </h1>
                        {business.description && (
                            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                                {business.description}
                            </p>
                        )}
                        <div className="mt-6 flex flex-wrap gap-4">
                             <a 
                                href="#booking-section"
                                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500"
                            >
                                Agendar Agora
                            </a>
                            <a 
                                href={googleMapsLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                                Ver no Mapa
                            </a>
                        </div>
                    </div>

                    {/* Gallery */}
                    {business.photos && business.photos.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2 h-96 rounded-2xl overflow-hidden">
                            <div className="col-span-4 md:col-span-2 row-span-2 relative">
                                <img src={business.photos[0]} alt="Principal" className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                            {business.photos.slice(1, 5).map((photo, i) => (
                                <div key={i} className="col-span-2 md:col-span-1 relative">
                                     <img src={photo} alt={`Galeria ${i}`} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 w-full rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                            <span className="flex items-center gap-2"><Share2 className="h-6 w-6" /> Sem fotos disponíveis</span>
                        </div>
                    )}

                </div>

                {/* Right Column: Details Card */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sticky top-4">
                        <h3 className="font-bold text-gray-900 mb-6 text-lg">Informações</h3>
                        
                        {/* Address */}
                        <div className="mb-6">
                            <h4 className="flex items-center text-sm font-semibold text-gray-500 mb-2">
                                <MapPin className="mr-2 h-4 w-4" /> Endereço
                            </h4>
                            <p className="text-gray-900 text-sm leading-relaxed">
                                {fullAddress}
                            </p>
                        </div>

                        {/* Hours */}
                        <div className="mb-6">
                            <h4 className="flex items-center text-sm font-semibold text-gray-500 mb-3">
                                <Clock className="mr-2 h-4 w-4" /> Horários
                            </h4>
                            <ul className="space-y-2 text-sm">
                                {(business.working_hours || []).map((day) => {
                                    const isToday = capitalize(todayWeekDay).includes(day.day);
                                    return (
                                        <li key={day.day} className={`flex justify-between ${isToday ? "font-bold text-primary-700 bg-primary-50 px-2 py-1 -mx-2 rounded" : "text-gray-600"}`}>
                                            <span>{day.day} {isToday && <span className="ml-1 text-xs text-primary-600">(Hoje)</span>}</span>
                                            <span>
                                                {day.active && day.intervals.length > 0 
                                                    ? `${day.intervals[0].start} - ${day.intervals[day.intervals.length - 1].end}` 
                                                    : "Fechado"}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Phones */}
                        <div className="mb-6">
                             <h4 className="flex items-center text-sm font-semibold text-gray-500 mb-2">
                                <Phone className="mr-2 h-4 w-4" /> Contato
                            </h4>
                            <div className="space-y-2">
                                {business.phone && (
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                        <span className="text-gray-900 font-medium">{business.phone}</span>
                                        <button onClick={() => copyToClipboard(business.phone!)} className="text-gray-400 hover:text-primary-600">
                                            {copiedPhone ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                )}
                                {business.secondary_phone && (
                                     <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                        <span className="text-gray-900 font-medium">{business.secondary_phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Social */}
                        {business.social_media && Object.values(business.social_media).some(Boolean) && (
                            <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-500 mb-3">
                                    <Share2 className="mr-2 h-4 w-4" /> Redes Sociais
                                </h4>
                                <div className="flex gap-2">
                                    {business.social_media.instagram && (
                                        <a href={business.social_media.instagram} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors">
                                            <Instagram className="h-5 w-5" />
                                        </a>
                                    )}
                                    {business.social_media.facebook && (
                                        <a href={business.social_media.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                            <Facebook className="h-5 w-5" />
                                        </a>
                                    )}
                                    {business.social_media.whatsapp && (
                                        <a href={business.social_media.whatsapp} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                                            <MessageCircle className="h-5 w-5" />
                                        </a>
                                    )}
                                     {business.social_media.website && (
                                        <a href={business.social_media.website} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                                            <Globe className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payments */}
                        {business.payment_methods && business.payment_methods.length > 0 && (
                            <div>
                                <h4 className="flex items-center text-sm font-semibold text-gray-500 mb-3">
                                    <CreditCard className="mr-2 h-4 w-4" /> Pagamento
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {business.payment_methods.map(method => (
                                        <span key={method} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                            {method}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Booking Section Anchor */}
      <div id="booking-section" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Agende seu horário</h2>
            <p className="mt-2 text-gray-600">Selecione o serviço e o profissional de sua preferência.</p>
        </div>
        
        {step < 5 && <StepIndicator currentStep={step} />}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100">
          {renderStep()}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-400">
            <p>AgendaPro &copy; {new Date().getFullYear()} - Sistema de Agendamento Online</p>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;