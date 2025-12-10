"use client";

import React, { useState } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { 
  Bell, 
  Clock, 
  Calendar,
  Building,
  Phone,
  MapPin,
  Save,
  Loader2,
  Instagram,
  Facebook,
  Globe,
  Image,
  Plus,
  X,
  CreditCard,
  DollarSign
} from "lucide-react";

const Settings: React.FC = () => {
  const { currentBusiness, updateBusiness, uploadBusinessPhoto } = useApp();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: currentBusiness?.name || "",
    description: currentBusiness?.description || "",
    phone: currentBusiness?.phone || "",
    secondary_phone: currentBusiness?.secondary_phone || "",
    address: currentBusiness?.address || "",
    // Address details
    cep: currentBusiness?.address_details?.cep || "",
    rua: currentBusiness?.address_details?.rua || "",
    numero: currentBusiness?.address_details?.numero || "",
    complemento: currentBusiness?.address_details?.complemento || "",
    bairro: currentBusiness?.address_details?.bairro || "",
    cidade: currentBusiness?.address_details?.cidade || "",
    estado: currentBusiness?.address_details?.estado || "",
    // Social media
    instagram: currentBusiness?.social_media?.instagram || "",
    facebook: currentBusiness?.social_media?.facebook || "",
    website: currentBusiness?.social_media?.website || "",
    // Photos
    photos: currentBusiness?.photos || [],
    // Payment methods
    payment_methods: currentBusiness?.payment_methods || [],
    // Working hours
    working_hours: currentBusiness?.working_hours || [
      { day: "Segunda", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Terça", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Quarta", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Quinta", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Sexta", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Sábado", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Domingo", intervals: [], active: false },
    ]
  });

  const handleSave = async () => {
    if (!currentBusiness?.id) return;
    
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        secondary_phone: formData.secondary_phone,
        address: formData.address,
        address_details: {
          cep: formData.cep,
          rua: formData.rua,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado
        },
        social_media: {
          instagram: formData.instagram,
          facebook: formData.facebook,
          website: formData.website
        },
        photos: formData.photos,
        payment_methods: formData.payment_methods,
        working_hours: formData.working_hours
      };

      await updateBusiness(payload);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      const file = e.target.files[0];
      const url = await uploadBusinessPhoto(file);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, url]
      }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Erro ao fazer upload da foto.");
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const togglePaymentMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method]
    }));
  };

  const updateWorkingHour = (dayIndex: number, field: 'active' | 'start' | 'end', value: string | boolean) => {
    const newHours = [...formData.working_hours];
    if (field === 'active') {
      newHours[dayIndex].active = value as boolean;
    } else {
      if (newHours[dayIndex].intervals.length === 0) {
        newHours[dayIndex].intervals = [{ start: "09:00", end: "18:00" }];
      }
      newHours[dayIndex].intervals[0][field] = value as string;
    }
    setFormData(prev => ({ ...prev, working_hours: newHours }));
  };

  if (!currentBusiness) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-500">Personalize as configurações do seu negócio</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </button>
        </div>

        <div className="space-y-8">
          {/* Informações Básicas do Negócio */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-400" />
              Informações do Negócio
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Atualize as informações básicas do seu negócio que aparecem para os clientes.
            </p>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Negócio
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone Principal
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone Secundário (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.secondary_phone}
                  onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Descreva seu negócio, serviços oferecidos, etc."
                />
              </div>
            </div>
          </div>

          {/* Endereço Detalhado */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              Endereço
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Informe o endereço completo do seu negócio.
            </p>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="87080700"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rua
                </label>
                <input
                  type="text"
                  value={formData.rua}
                  onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                  placeholder="Rua pequi"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="602"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Esquina"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  placeholder="Jd tropical"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Maringá"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado (UF)
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-400" />
              Redes Sociais
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Adicione os links das suas redes sociais.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram (URL)
                </label>
                <input
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="https://instagram.com/seu_perfil"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook (URL)
                </label>
                <input
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="https://facebook.com/seu_perfil"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://seusite.com"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Galeria de Fotos */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <Image className="h-5 w-5 text-gray-400" />
              Galeria de Fotos
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Máx. 6 fotos. Adicione fotos do seu negócio para atrair mais clientes.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {formData.photos.length < 6 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center">
                  <label className="cursor-pointer flex flex-col items-center">
                    <Plus className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Adicionar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              Formas de Pagamento Aceitas
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Selecione as formas de pagamento que seu negócio aceita.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: "Dinheiro", icon: DollarSign },
                { key: "Cartão de Crédito", icon: CreditCard },
                { key: "Cartão de Débito", icon: CreditCard },
                { key: "PIX", icon: DollarSign },
                { key: "Vale Refeição", icon: CreditCard }
              ].map(({ key, icon: Icon }) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.payment_methods.includes(key)
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.payment_methods.includes(key)}
                    onChange={() => togglePaymentMethod(key)}
                    className="sr-only"
                  />
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{key}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Horário de Funcionamento
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Configure os horários de funcionamento do seu negócio.
            </p>
            
            <div className="space-y-4">
              {formData.working_hours.map((day, index) => (
                <div key={day.day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.active}
                      onChange={(e) => updateWorkingHour(index, 'active', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-medium text-gray-900 w-20">{day.day}</span>
                  </label>
                  
                  {day.active && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={day.intervals[0]?.start || "09:00"}
                        onChange={(e) => updateWorkingHour(index, 'start', e.target.value)}
                        className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-gray-500">até</span>
                      <input
                        type="time"
                        value={day.intervals[0]?.end || "18:00"}
                        onChange={(e) => updateWorkingHour(index, 'end', e.target.value)}
                        className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Configurações de Lembretes */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-400" />
              Configurações de Lembretes
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Configure quando e como os lembretes de agendamento serão enviados automaticamente.
            </p>
            
            <div className="space-y-6">
              {/* Lembretes no Mesmo Dia */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${currentBusiness?.reminder_config?.same_day_enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Lembretes no Mesmo Dia</h3>
                    <p className="text-sm text-gray-500">
                      Enviar lembretes algumas horas antes do agendamento
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBusiness?.reminder_config?.same_day_enabled ?? true}
                    onChange={(e) => {
                      const newConfig = {
                        ...currentBusiness?.reminder_config,
                        same_day_enabled: e.target.checked
                      };
                      updateBusiness({ reminder_config: newConfig });
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Ativar</span>
                </label>
              </div>

              {currentBusiness?.reminder_config?.same_day_enabled && (
                <div className="ml-6 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas antes do agendamento
                  </label>
                  <select
                    value={currentBusiness?.reminder_config?.same_day_hours_before ?? 2}
                    onChange={(e) => {
                      const newConfig = {
                        ...currentBusiness?.reminder_config,
                        same_day_hours_before: parseInt(e.target.value)
                      };
                      updateBusiness({ reminder_config: newConfig });
                    }}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value={1}>1 hora antes</option>
                    <option value={2}>2 horas antes</option>
                    <option value={3}>3 horas antes</option>
                    <option value={4}>4 horas antes</option>
                    <option value={6}>6 horas antes</option>
                    <option value={8}>8 horas antes</option>
                  </select>
                </div>
              )}

              {/* Lembretes no Dia Anterior */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${currentBusiness?.reminder_config?.previous_day_enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Lembretes no Dia Anterior</h3>
                    <p className="text-sm text-gray-500">
                      Para agendamentos muito cedo, enviar lembretes no dia anterior
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBusiness?.reminder_config?.previous_day_enabled ?? true}
                    onChange={(e) => {
                      const newConfig = {
                        ...currentBusiness?.reminder_config,
                        previous_day_enabled: e.target.checked
                      };
                      updateBusiness({ reminder_config: newConfig });
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Ativar</span>
                </label>
              </div>

              {currentBusiness?.reminder_config?.previous_day_enabled && (
                <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário limite para considerar "muito cedo"
                    </label>
                    <input
                      type="time"
                      value={currentBusiness?.reminder_config?.early_threshold_hour ?? "09:00"}
                      onChange={(e) => {
                        const newConfig = {
                          ...currentBusiness?.reminder_config,
                          early_threshold_hour: e.target.value
                        };
                        updateBusiness({ reminder_config: newConfig });
                      }}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Agendamentos antes deste horário serão considerados "muito cedo"
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário para enviar lembretes no dia anterior
                    </label>
                    <input
                      type="time"
                      value={currentBusiness?.reminder_config?.previous_day_time ?? "19:00"}
                      onChange={(e) => {
                        const newConfig = {
                          ...currentBusiness?.reminder_config,
                          previous_day_time: e.target.value
                        };
                        updateBusiness({ reminder_config: newConfig });
                      }}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Horário aproximado para enviar lembretes no dia anterior
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;