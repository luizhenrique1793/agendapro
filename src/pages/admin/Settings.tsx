import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { Save, Calendar, CheckCircle2, Loader2, Trash2, MapPin, CreditCard, Share2, Image as ImageIcon, Plus } from "lucide-react";
import { useApp } from "../../store";
import { Business } from "../../types";

const defaultSchedule = [
  { day: "Segunda", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Terça", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Quarta", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Quinta", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Sexta", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Sábado", intervals: [{ start: "09:00", end: "18:00" }], active: true },
  { day: "Domingo", intervals: [], active: false },
];

const Settings: React.FC = () => {
  const { currentBusiness, updateBusiness, googleCalendarConnected, toggleGoogleCalendar, uploadBusinessPhoto } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Business>>({
    name: "",
    phone: "",
    secondary_phone: "",
    description: "",
    address: "", // legado
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

  useEffect(() => {
    if (currentBusiness) {
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
    }
  }, [currentBusiness]);

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
          setFormData(prev => ({
              ...prev,
              photos: [...(prev.photos || []), url].slice(0, 6) // Limit to 6
          }));
      } catch (error) {
          console.error("Error uploading photo:", error);
          alert("Erro ao enviar foto.");
      } finally {
          setUploadingPhoto(false);
      }
  };

  const removePhoto = (index: number) => {
      setFormData(prev => ({
          ...prev,
          photos: (prev.photos || []).filter((_, i) => i !== index)
      }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Create legacy address string
      const ad = formData.address_details;
      const legacyAddress = ad ? `${ad.street}, ${ad.number} - ${ad.neighborhood}, ${ad.city} - ${ad.state}` : "";
      
      await updateBusiness({
          ...formData,
          address: legacyAddress
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
          <h1 className="mb-8 text-2xl font-bold text-gray-900">Perfil do Negócio</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            
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