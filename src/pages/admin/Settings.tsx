"use client";

import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { Save, Loader2 } from "lucide-react";

// Types
interface FormData {
  name: string;
  description: string;
  phone: string;
  secondary_phone: string;
  address: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  instagram: string;
  facebook: string;
  website: string;
  photos: string[];
  payment_methods: string[];
  working_hours: {
    day: string;
    intervals: { start: string; end: string }[];
    active: boolean;
  }[];
}

// Custom Hook for Settings State
const useSettingsState = (currentBusiness: any) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    phone: "",
    secondary_phone: "",
    address: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    instagram: "",
    facebook: "",
    website: "",
    photos: [],
    payment_methods: [],
    working_hours: [
      { day: "Segunda", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Terça", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Quarta", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Quinta", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Sexta", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Sábado", intervals: [{ start: "09:00", end: "18:00" }], active: true },
      { day: "Domingo", intervals: [], active: false },
    ]
  });

  // Load data when currentBusiness changes
  useEffect(() => {
    if (currentBusiness) {
      setFormData({
        name: currentBusiness.name || "",
        description: currentBusiness.description || "",
        phone: currentBusiness.phone || "",
        secondary_phone: currentBusiness.secondary_phone || "",
        address: currentBusiness.address || "",
        cep: currentBusiness.address_details?.cep || "",
        rua: currentBusiness.address_details?.rua || "",
        numero: currentBusiness.address_details?.numero || "",
        complemento: currentBusiness.address_details?.complemento || "",
        bairro: currentBusiness.address_details?.bairro || "",
        cidade: currentBusiness.address_details?.cidade || "",
        estado: currentBusiness.address_details?.estado || "",
        instagram: currentBusiness.social_media?.instagram || "",
        facebook: currentBusiness.social_media?.facebook || "",
        website: currentBusiness.social_media?.website || "",
        photos: currentBusiness.photos || [],
        payment_methods: currentBusiness.payment_methods || [],
        working_hours: currentBusiness.working_hours || [
          { day: "Segunda", intervals: [{ start: "09:00", end: "18:00" }], active: true },
          { day: "Terça", intervals: [{ start: "09:00", end: "18:00" }], active: true },
          { day: "Quarta", intervals: [{ start: "09:00", end: "18:00" }], active: true },
          { day: "Quinta", intervals: [{ start: "09:00", end: "18:00" }], active: true },
          { day: "Sexta", intervals: [{ start: "09:00", end: "18:00" }], active: true },
          { day: "Sábado", intervals: [{ start: "09:00", end: "18:00" }], active: true },
          { day: "Domingo", intervals: [], active: false },
        ]
      });
    }
  }, [currentBusiness]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return { formData, updateFormData, saving, setSaving };
};

// Reusable Input Component
const FormInput: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}> = ({ label, type = "text", value, onChange, placeholder, required, rows }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    {rows ? (
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
      />
    )}
  </div>
);

// Business Info Section
const BusinessInfoSection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}> = ({ formData, updateFormData }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
      <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
        <span className="text-blue-600 text-xs font-bold">B</span>
      </div>
      Informações do Negócio
    </h2>
    <p className="text-sm text-gray-500 mb-6">
      Atualize as informações básicas do seu negócio que aparecem para os clientes.
    </p>

    <div className="grid gap-6 md:grid-cols-2">
      <FormInput
        label="Nome do Negócio"
        value={formData.name}
        onChange={(value) => updateFormData({ name: value })}
      />

      <FormInput
        label="Telefone Principal"
        type="tel"
        value={formData.phone}
        onChange={(value) => updateFormData({ phone: value })}
      />

      <FormInput
        label="Telefone Secundário (opcional)"
        type="tel"
        value={formData.secondary_phone}
        onChange={(value) => updateFormData({ secondary_phone: value })}
      />

      <div className="md:col-span-2">
        <FormInput
          label="Descrição"
          value={formData.description}
          onChange={(value) => updateFormData({ description: value })}
          placeholder="Descreva seu negócio, serviços oferecidos, etc."
          rows={4}
        />
      </div>
    </div>
  </div>
);

// Address Section
const AddressSection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}> = ({ formData, updateFormData }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
      <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
        <span className="text-green-600 text-xs font-bold">📍</span>
      </div>
      Endereço
    </h2>
    <p className="text-sm text-gray-500 mb-6">
      Informe o endereço completo do seu negócio.
    </p>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <FormInput
        label="CEP"
        value={formData.cep}
        onChange={(value) => updateFormData({ cep: value })}
        placeholder="87080700"
      />

      <div className="md:col-span-2">
        <FormInput
          label="Rua"
          value={formData.rua}
          onChange={(value) => updateFormData({ rua: value })}
          placeholder="Rua pequi"
        />
      </div>

      <FormInput
        label="Número"
        value={formData.numero}
        onChange={(value) => updateFormData({ numero: value })}
        placeholder="602"
      />

      <FormInput
        label="Complemento"
        value={formData.complemento}
        onChange={(value) => updateFormData({ complemento: value })}
        placeholder="Esquina"
      />

      <FormInput
        label="Bairro"
        value={formData.bairro}
        onChange={(value) => updateFormData({ bairro: value })}
        placeholder="Jd tropical"
      />

      <FormInput
        label="Cidade"
        value={formData.cidade}
        onChange={(value) => updateFormData({ cidade: value })}
        placeholder="Maringá"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado (UF)
        </label>
        <select
          value={formData.estado}
          onChange={(e) => updateFormData({ estado: e.target.value })}
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
);

// Social Media Section
const SocialMediaSection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}> = ({ formData, updateFormData }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
      <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
        <span className="text-purple-600 text-xs font-bold">@</span>
      </div>
      Redes Sociais
    </h2>
    <p className="text-sm text-gray-500 mb-6">
      Adicione os links das suas redes sociais.
    </p>

    <div className="space-y-4">
      <FormInput
        label="Instagram (URL)"
        type="url"
        value={formData.instagram}
        onChange={(value) => updateFormData({ instagram: value })}
        placeholder="https://instagram.com/seu_perfil"
      />

      <FormInput
        label="Facebook (URL)"
        type="url"
        value={formData.facebook}
        onChange={(value) => updateFormData({ facebook: value })}
        placeholder="https://facebook.com/seu_perfil"
      />

      <FormInput
        label="Website"
        type="url"
        value={formData.website}
        onChange={(value) => updateFormData({ website: value })}
        placeholder="https://seusite.com"
      />
    </div>
  </div>
);

// Photo Gallery Section
const PhotoGallerySection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  uploadBusinessPhoto: (file: File) => Promise<string>;
}> = ({ formData, updateFormData, uploadBusinessPhoto }) => {
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      const file = e.target.files[0];
      const url = await uploadBusinessPhoto(file);
      updateFormData({
        photos: [...formData.photos, url]
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Erro ao fazer upload da foto.");
    }
  };

  const removePhoto = (index: number) => {
    updateFormData({
      photos: formData.photos.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
        <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
          <span className="text-orange-600 text-xs font-bold">📷</span>
        </div>
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
              <span className="text-xs">×</span>
            </button>
          </div>
        ))}

        {formData.photos.length < 6 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center">
            <label className="cursor-pointer flex flex-col items-center">
              <span className="text-2xl mb-2">+</span>
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
  );
};

// Payment Methods Section
const PaymentMethodsSection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}> = ({ formData, updateFormData }) => {
  const togglePaymentMethod = (method: string) => {
    const currentMethods = formData.payment_methods || [];
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];
    updateFormData({ payment_methods: newMethods });
  };

  const paymentOptions = [
    { key: "Dinheiro", icon: "💵" },
    { key: "Cartão de Crédito", icon: "💳" },
    { key: "Cartão de Débito", icon: "💳" },
    { key: "PIX", icon: "📱" },
    { key: "Vale Refeição", icon: "🎫" }
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
        <div className="w-5 h-5 bg-teal-100 rounded flex items-center justify-center">
          <span className="text-teal-600 text-xs font-bold">💰</span>
        </div>
        Formas de Pagamento Aceitas
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Selecione as formas de pagamento que seu negócio aceita.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {paymentOptions.map(({ key, icon }) => (
          <label
            key={key}
            className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              formData.payment_methods?.includes(key)
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <input
              type="checkbox"
              checked={formData.payment_methods?.includes(key) || false}
              onChange={() => togglePaymentMethod(key)}
              className="sr-only"
            />
            <span className="text-lg">{icon}</span>
            <span className="font-medium">{key}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// Working Hours Section
const WorkingHoursSection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}> = ({ formData, updateFormData }) => {
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
    updateFormData({ working_hours: newHours });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
        <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center">
          <span className="text-indigo-600 text-xs font-bold">🕐</span>
        </div>
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
  );
};

// Reminders Section
const RemindersSection: React.FC<{
  currentBusiness: any;
  updateBusiness: (updates: any) => Promise<void>;
}> = ({ currentBusiness, updateBusiness }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
      <div className="w-5 h-5 bg-yellow-100 rounded flex items-center justify-center">
        <span className="text-yellow-600 text-xs font-bold">🔔</span>
      </div>
      Configurações de Lembretes
    </h2>
    <p className="text-sm text-gray-500 mb-6">
      Configure quando e como os lembretes de agendamento serão enviados automaticamente.
    </p>

    <div className="space-y-6">
      {/* Same Day Reminders */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${currentBusiness?.reminder_config?.same_day_enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            <span className="text-sm">🕐</span>
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

      {/* Previous Day Reminders */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${currentBusiness?.reminder_config?.previous_day_enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            <span className="text-sm">📅</span>
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
);

// Main Settings Component
const Settings: React.FC = () => {
  const { currentBusiness, updateBusiness, uploadBusinessPhoto } = useApp();
  const { formData, updateFormData, saving, setSaving } = useSettingsState(currentBusiness);

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
          <BusinessInfoSection formData={formData} updateFormData={updateFormData} />
          <AddressSection formData={formData} updateFormData={updateFormData} />
          <SocialMediaSection formData={formData} updateFormData={updateFormData} />
          <PhotoGallerySection
            formData={formData}
            updateFormData={updateFormData}
            uploadBusinessPhoto={uploadBusinessPhoto}
          />
          <PaymentMethodsSection formData={formData} updateFormData={updateFormData} />
          <WorkingHoursSection formData={formData} updateFormData={updateFormData} />
          <RemindersSection currentBusiness={currentBusiness} updateBusiness={updateBusiness} />
        </div>
      </main>
    </div>
  );
};

export default Settings;