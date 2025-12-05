import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { 
  Save, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  Trash2, 
  MapPin, 
  CreditCard, 
  Share2, 
  Image as ImageIcon, 
  Plus, 
  Store, 
  Bot, 
  MessageSquare, 
  Sparkles, 
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useApp } from "../../store";
import { Business, AssistantConfig } from "../../types";

const defaultSchedule = [
  { day: "Segunda", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Terça", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Quarta", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Quinta", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Sexta", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Sábado", intervals: [{ start: "09:00", end: "18:00" }], active: true },
  { day: "Domingo", intervals: [], active: false },
];

const defaultAssistantConfig: AssistantConfig = {
  active: true,
  identity: {
    name: "Agente Virtual",
    tone: "Profissional e acolhedor",
    description: "Assistente responsável por agendamentos e dúvidas básicas."
  },
  messages: {
    welcome_new: "Olá! Tudo bem? Sou o assistente virtual. Como posso ajudar você hoje?",
    welcome_existing: "Olá de novo! Bom te ver por aqui. Gostaria de agendar um horário?",
    confirmation_booking: "Perfeito! Seu agendamento foi confirmado com sucesso. Te esperamos lá!",
    confirmation_reschedule: "Tudo certo! Seu horário foi alterado conforme solicitado.",
    confirmation_cancellation: "Entendido. Seu agendamento foi cancelado. Quando quiser marcar novamente, é só chamar!",
    no_slots: "Poxa, não encontrei horários disponíveis para essa data. Gostaria de ver outra data?",
    service_unavailable: "Desculpe, não realizamos esse serviço específico. Posso te mostrar nossa lista de serviços?",
    professional_unavailable: "Esse profissional não tem agenda disponível nesse momento."
  },
  persuasion: {
    benefits: "Profissionais experientes, ambiente climatizado e cafézinho por nossa conta.",
    extra_phrases: "Aproveite para renovar o visual para o fim de semana!"
  },
  behavior: {
    ask_if_new_client: true,
    search_by_phone: true,
    show_services_first: false,
    require_confirmation: true,
    persuasive_mode: false
  }
};

const Settings: React.FC = () => {
  const { currentBusiness, updateBusiness, uploadBusinessPhoto } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'ai_agent'>('profile');
  
  // Estado para o Perfil do Negócio
  const [formData, setFormData] = useState<Partial<Business>>({
    name: "",
    phone: "",
    secondary_phone: "",
    description: "",
    address: "",
    address_details: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: ""
    },
    social_media: {
        instagram: "",
        facebook: "",
        website: "",
        whatsapp: ""
    },
    payment_methods: [],
    photos: [],
    working_hours: defaultSchedule,
  });

  // Estado para o Agente IA
  const [assistantData, setAssistantData] = useState<AssistantConfig>(defaultAssistantConfig);

  useEffect(() => {
    if (currentBusiness) {
      // Carrega dados do Perfil
      setFormData({
        ...currentBusiness,
        working_hours: currentBusiness.working_hours && currentBusiness.working_hours.length > 0 ? currentBusiness.working_hours : defaultSchedule,
        address_details: currentBusiness.address_details || {
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
            zipCode: ""
        },
        social_media: currentBusiness.social_media || {
            instagram: "",
            facebook: "",
            website: "",
            whatsapp: ""
        },
        payment_methods: currentBusiness.payment_methods || [],
        photos: currentBusiness.photos || []
      });

      // Carrega dados do Agente IA (com merge do default para evitar undefined)
      if (currentBusiness.assistant_config) {
        setAssistantData({
            ...defaultAssistantConfig,
            ...currentBusiness.assistant_config,
            identity: { ...defaultAssistantConfig.identity, ...(currentBusiness.assistant_config.identity || {}) },
            messages: { ...defaultAssistantConfig.messages, ...(currentBusiness.assistant_config.messages || {}) },
            persuasion: { ...defaultAssistantConfig.persuasion, ...(currentBusiness.assistant_config.persuasion || {}) },
            behavior: { ...defaultAssistantConfig.behavior, ...(currentBusiness.assistant_config.behavior || {}) }
        });
      }
    }
  }, [currentBusiness]);

  // --- Handlers de Perfil ---
  const handleInputChange = (field: keyof Business, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddressChange = (field: string, value: string) => {
      setFormData(prev => ({
          ...prev,
          address_details: { ...prev.address_details!, [field]: value }
      }));
  };

  const handleSocialChange = (field: string, value: string) => {
      setFormData(prev => ({
          ...prev,
          social_media: { ...prev.social_media!, [field]: value }
      }));
  };

  const handlePaymentMethodToggle = (method: string) => {
      setFormData(prev => {
          const current = prev.payment_methods || [];
          if (current.includes(method)) {
              return { ...prev, payment_methods: current.filter(m => m !== method) };
          } else {
              return { ...prev, payment_methods: [...current, method] };
          }
      });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploadingPhoto(true);
      try {
          const url = await uploadBusinessPhoto(file);
          setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), url].slice(0, 6) }));
      } catch (error) {
          console.error("Error uploading photo:", error);
          alert("Erro ao enviar foto.");
      } finally {
          setUploadingPhoto(false);
      }
  };

  const removePhoto = (index: number) => {
      setFormData(prev => ({ ...prev, photos: (prev.photos || []).filter((_, i) => i !== index) }));
  };

  const handleScheduleChange = (dayIndex: number, intervalIndex: number, field: 'start' | 'end', value: string) => {
    const newSchedule = [...(formData.working_hours || [])];
    newSchedule[dayIndex].intervals[intervalIndex][field] = value;
    setFormData({ ...formData, working_hours: newSchedule });
  };

  const addInterval = (dayIndex: number) => {
    const newSchedule = [...(formData.working_hours || [])];
    newSchedule[dayIndex].intervals.push({ start: "09:00", end: "18:00" });
    setFormData({ ...formData, working_hours: newSchedule });
  };

  const removeInterval = (dayIndex: number, intervalIndex: number) => {
    const newSchedule = [...(formData.working_hours || [])];
    newSchedule[dayIndex].intervals.splice(intervalIndex, 1);
    setFormData({ ...formData, working_hours: newSchedule });
  };

  const toggleDayActive = (dayIndex: number) => {
    const newSchedule = [...(formData.working_hours || [])];
    newSchedule[dayIndex].active = !newSchedule[dayIndex].active;
    setFormData({ ...formData, working_hours: newSchedule });
  };

  // --- Handlers de Agente IA ---
  const handleAssistantIdentityChange = (field: keyof AssistantConfig['identity'], value: string) => {
    setAssistantData(prev => ({ ...prev, identity: { ...prev.identity, [field]: value } }));
  };

  const handleAssistantMessageChange = (field: keyof AssistantConfig['messages'], value: string) => {
    setAssistantData(prev => ({ ...prev, messages: { ...prev.messages, [field]: value } }));
  };

  const handleAssistantPersuasionChange = (field: keyof AssistantConfig['persuasion'], value: string) => {
    setAssistantData(prev => ({ ...prev, persuasion: { ...prev.persuasion, [field]: value } }));
  };

  const handleAssistantBehaviorChange = (field: keyof AssistantConfig['behavior']) => {
    setAssistantData(prev => ({ 
        ...prev, 
        behavior: { ...prev.behavior, [field]: !prev.behavior[field] } 
    }));
  };

  // --- Submit Geral ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ad = formData.address_details;
      const legacyAddress = ad ? `${ad.street}, ${ad.number} - ${ad.neighborhood}, ${ad.city} - ${ad.state}` : "";
      
      // Salva tanto o perfil quanto as configs do agente
      await updateBusiness({
          ...formData,
          address: legacyAddress,
          assistant_config: assistantData
      });
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Ocorreu um erro ao salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const paymentOptions = ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "PIX", "Vale Refeição"];

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            
            {/* Abas de Navegação */}
            <div className="flex rounded-lg bg-white p-1 shadow-sm border border-gray-200">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'profile' 
                        ? 'bg-primary-50 text-primary-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <Store className="h-4 w-4" /> Perfil do Negócio
                </button>
                <button
                    onClick={() => setActiveTab('ai_agent')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'ai_agent' 
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <Bot className="h-4 w-4" /> Agente IA
                </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* =================================================================================
                ABA: PERFIL DO NEGÓCIO 
               ================================================================================= */}
            {activeTab === 'profile' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    
                    {/* Informações Básicas */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-gray-400" />
                        Informações Básicas
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Negócio</label>
                        <input type="text" required value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone Principal</label>
                        <input type="text" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone Secundário (opcional)</label>
                        <input type="text" value={formData.secondary_phone} onChange={(e) => handleInputChange('secondary_phone', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                        </div>
                        <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Descrição Curta (Bio)</label>
                        <textarea rows={3} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="Conte um pouco sobre seu negócio..." />
                        </div>
                    </div>
                    </div>

                    {/* Endereço Detalhado */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            Endereço
                        </h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700">CEP</label>
                                <input type="text" value={formData.address_details?.zipCode} onChange={(e) => handleAddressChange('zipCode', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Rua</label>
                                <input type="text" value={formData.address_details?.street} onChange={(e) => handleAddressChange('street', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Número</label>
                                <input type="text" value={formData.address_details?.number} onChange={(e) => handleAddressChange('number', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Complemento</label>
                                <input type="text" value={formData.address_details?.complement} onChange={(e) => handleAddressChange('complement', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                                <input type="text" value={formData.address_details?.neighborhood} onChange={(e) => handleAddressChange('neighborhood', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                                <input type="text" value={formData.address_details?.city} onChange={(e) => handleAddressChange('city', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Estado (UF)</label>
                                <input type="text" maxLength={2} value={formData.address_details?.state} onChange={(e) => handleAddressChange('state', e.target.value.toUpperCase())} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                        </div>
                    </div>

                    {/* Redes Sociais */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-gray-400" />
                            Redes Sociais
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Instagram (URL)</label>
                                <input type="url" value={formData.social_media?.instagram} onChange={(e) => handleSocialChange('instagram', e.target.value)} placeholder="https://instagram.com/seu_perfil" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Facebook (URL)</label>
                                <input type="url" value={formData.social_media?.facebook} onChange={(e) => handleSocialChange('facebook', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Website</label>
                                <input type="url" value={formData.social_media?.website} onChange={(e) => handleSocialChange('website', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Galeria de Fotos */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                                Galeria de Fotos
                            </h2>
                            <span className="text-sm text-gray-500">Máx. 6 fotos</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                            {(formData.photos || []).map((photoUrl, index) => (
                                <div key={index} className="relative aspect-square group">
                                    <img src={photoUrl} alt={`Foto ${index}`} className="h-full w-full rounded-lg object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            
                            {(formData.photos?.length || 0) < 6 && (
                                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
                                    {uploadingPhoto ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    ) : (
                                        <>
                                            <Plus className="h-6 w-6 text-gray-400" />
                                            <span className="mt-1 text-xs text-gray-500">Adicionar</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Formas de Pagamento */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-gray-400" />
                            Formas de Pagamento Aceitas
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {paymentOptions.map(option => (
                                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.payment_methods?.includes(option)}
                                        onChange={() => handlePaymentMethodToggle(option)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-gray-700 text-sm">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Hours */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        Horário de Funcionamento
                    </h2>
                    <div className="space-y-4">
                        {(formData.working_hours || []).map((day, dayIndex) => (
                        <div key={day.day} className="rounded-lg border border-gray-100 p-3">
                            <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={day.active} onChange={() => toggleDayActive(dayIndex)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="font-medium text-gray-700">{day.day}</span>
                            </div>
                            {day.active && (
                                <button type="button" onClick={() => addInterval(dayIndex)} className="text-xs text-primary-600 hover:text-primary-700">+ Adicionar intervalo</button>
                            )}
                            </div>
                            {day.active && (
                            <div className="space-y-2 pl-7">
                                {day.intervals.map((interval, intervalIndex) => (
                                <div key={intervalIndex} className="flex items-center gap-2">
                                    <input type="time" value={interval.start} onChange={(e) => handleScheduleChange(dayIndex, intervalIndex, 'start', e.target.value)} className="rounded-md border-gray-300 text-sm" />
                                    <span className="self-center text-gray-500">às</span>
                                    <input type="time" value={interval.end} onChange={(e) => handleScheduleChange(dayIndex, intervalIndex, 'end', e.target.value)} className="rounded-md border-gray-300 text-sm" />
                                    <button type="button" onClick={() => removeInterval(dayIndex, intervalIndex)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                ))}
                                {day.intervals.length === 0 && <p className="text-xs text-gray-400 italic">Nenhum intervalo. O dia está fechado.</p>}
                            </div>
                            )}
                            {!day.active && <p className="pl-7 text-sm text-gray-500 italic">Fechado</p>}
                        </div>
                        ))}
                    </div>
                    </div>
                </div>
            )}

            {/* =================================================================================
                ABA: AGENTE IA 
               ================================================================================= */}
            {activeTab === 'ai_agent' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* Controle Geral */}
                    <div className={`flex items-center justify-between rounded-xl border p-6 shadow-sm transition-colors ${assistantData.active ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${assistantData.active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                                <Bot className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Agente de Agendamento</h2>
                                <p className="text-sm text-gray-600">
                                    {assistantData.active 
                                        ? "O agente está ATIVO e responderá aos clientes no WhatsApp." 
                                        : "O agente está INATIVO. Seus clientes não receberão respostas automáticas."}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAssistantData(prev => ({ ...prev, active: !prev.active }))}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                assistantData.active 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {assistantData.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                            {assistantData.active ? "Ativado" : "Desativado"}
                        </button>
                    </div>

                    {/* Identidade do Agente */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-gray-400" />
                            Identidade e Persona
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome do Agente</label>
                                <input 
                                    type="text" 
                                    value={assistantData.identity.name} 
                                    onChange={(e) => handleAssistantIdentityChange('name', e.target.value)} 
                                    placeholder="Ex: Luna, Max, Atendente Virtual"
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                                />
                                <p className="mt-1 text-xs text-gray-500">Como o agente se apresentará para o cliente.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tom de Voz</label>
                                <input 
                                    type="text" 
                                    value={assistantData.identity.tone} 
                                    onChange={(e) => handleAssistantIdentityChange('tone', e.target.value)} 
                                    placeholder="Ex: Formal, Descontraído, Empático"
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                                />
                                <p className="mt-1 text-xs text-gray-500">Define a personalidade das respostas.</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Descrição Curta</label>
                                <textarea 
                                    rows={2} 
                                    value={assistantData.identity.description} 
                                    onChange={(e) => handleAssistantIdentityChange('description', e.target.value)} 
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                                />
                                <p className="mt-1 text-xs text-gray-500">Contexto para a IA entender seu papel (prompt do sistema).</p>
                            </div>
                        </div>
                    </div>

                    {/* Mensagens Personalizadas */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-gray-400" />
                            Personalização de Mensagens
                        </h2>
                        <p className="mb-6 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            Essas mensagens são usadas como guias para a IA. Ela pode adaptar levemente o texto para manter a conversa fluida, mas seguirá a essência do que você escrever aqui.
                        </p>
                        
                        <div className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Boas-vindas (Novo Cliente)</label>
                                    <textarea rows={3} value={assistantData.messages.welcome_new} onChange={(e) => handleAssistantMessageChange('welcome_new', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Boas-vindas (Cliente Recorrente)</label>
                                    <textarea rows={3} value={assistantData.messages.welcome_existing} onChange={(e) => handleAssistantMessageChange('welcome_existing', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirmação de Agendamento</label>
                                    <textarea rows={3} value={assistantData.messages.confirmation_booking} onChange={(e) => handleAssistantMessageChange('confirmation_booking', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirmação de Reagendamento</label>
                                    <textarea rows={3} value={assistantData.messages.confirmation_reschedule} onChange={(e) => handleAssistantMessageChange('confirmation_reschedule', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirmação de Cancelamento</label>
                                    <textarea rows={3} value={assistantData.messages.confirmation_cancellation} onChange={(e) => handleAssistantMessageChange('confirmation_cancellation', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sem Horários Disponíveis</label>
                                    <textarea rows={3} value={assistantData.messages.no_slots} onChange={(e) => handleAssistantMessageChange('no_slots', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Serviço Indisponível</label>
                                    <textarea rows={3} value={assistantData.messages.service_unavailable} onChange={(e) => handleAssistantMessageChange('service_unavailable', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Profissional Indisponível</label>
                                    <textarea rows={3} value={assistantData.messages.professional_unavailable} onChange={(e) => handleAssistantMessageChange('professional_unavailable', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Persuasão e Vendas */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Persuasão e Benefícios
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Benefícios do Negócio</label>
                                <textarea 
                                    rows={4} 
                                    value={assistantData.persuasion.benefits} 
                                    onChange={(e) => handleAssistantPersuasionChange('benefits', e.target.value)} 
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                                    placeholder="Liste diferenciais (ex: Café grátis, ar condicionado, barbeiros premiados...)"
                                />
                                <p className="mt-1 text-xs text-gray-500">Usado para convencer novos clientes.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Frases Extras / Promoções</label>
                                <textarea 
                                    rows={4} 
                                    value={assistantData.persuasion.extra_phrases} 
                                    onChange={(e) => handleAssistantPersuasionChange('extra_phrases', e.target.value)} 
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                                    placeholder="Ex: Temos uma promoção de corte + barba nas terças!"
                                />
                                <p className="mt-1 text-xs text-gray-500">Informações adicionais que o agente pode mencionar.</p>
                            </div>
                        </div>
                    </div>

                    {/* Comportamento */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-gray-400" />
                            Controles de Comportamento
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={assistantData.behavior.ask_if_new_client} 
                                    onChange={() => handleAssistantBehaviorChange('ask_if_new_client')}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">Perguntar se é cliente novo</span>
                                    <span className="block text-xs text-gray-500">Ajuda a personalizar as boas-vindas.</span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={assistantData.behavior.search_by_phone} 
                                    onChange={() => handleAssistantBehaviorChange('search_by_phone')}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">Busca Automática</span>
                                    <span className="block text-xs text-gray-500">Buscar histórico usando o telefone do WhatsApp.</span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={assistantData.behavior.show_services_first} 
                                    onChange={() => handleAssistantBehaviorChange('show_services_first')}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">Exibir Serviços Primeiro</span>
                                    <span className="block text-xs text-gray-500">Mandar lista de serviços logo no início.</span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={assistantData.behavior.require_confirmation} 
                                    onChange={() => handleAssistantBehaviorChange('require_confirmation')}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">Exigir Confirmação</span>
                                    <span className="block text-xs text-gray-500">Pedir um "Sim" explícito antes de agendar.</span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={assistantData.behavior.persuasive_mode} 
                                    onChange={() => handleAssistantBehaviorChange('persuasive_mode')}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">Modo Persuasivo</span>
                                    <span className="block text-xs text-gray-500">Usar linguagem mais vendedora.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end sticky bottom-6 z-10">
              <button type="submit" disabled={isSaving} className="flex items-center rounded-xl bg-primary-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-primary-500 disabled:opacity-70 transition-transform hover:scale-105">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;