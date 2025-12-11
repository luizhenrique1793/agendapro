"use client";

import React, { useState } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { Save, Loader2, Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: currentBusiness?.name || "",
    description: currentBusiness?.description || "",
    phone: currentBusiness?.phone || "",
    secondary_phone: currentBusiness?.secondary_phone || "",
    address: currentBusiness?.address || "",
    cep: currentBusiness?.address_details?.cep || "",
    rua: currentBusiness?.address_details?.rua || "",
    numero: currentBusiness?.address_details?.numero || "",
    complemento: currentBusiness?.address_details?.complemento || "",
    bairro: currentBusiness?.address_details?.bairro || "",
    cidade: currentBusiness?.address_details?.cidade || "",
    estado: currentBusiness?.address_details?.estado || "",
    instagram: currentBusiness?.social_media?.instagram || "",
    facebook: currentBusiness?.social_media?.facebook || "",
    website: currentBusiness?.social_media?.website || "",
    photos: currentBusiness?.photos || [],
    payment_methods: currentBusiness?.payment_methods || [],
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

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return { formData, updateFormData, saving, setSaving, error, setError };
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
  icon?: React.ReactNode;
}> = ({ label, type = "text", value, onChange, placeholder, required, rows, icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors ${icon ? 'pl-10' : ''}`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors ${icon ? 'pl-10' : ''}`}
        />
      )}
    </div>
  </div>
);

// Business Info Section
const BusinessInfoSection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}> = ({ formData, updateFormData }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 text-sm font-bold">🏢</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Informações do Negócio</h2>
          <p className="text-sm text-gray-600">Dados básicos que aparecem para seus clientes</p>
        </div>
      </div>
    </div>
    <div className="p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <FormInput
          label="Nome do Negócio"
          value={formData.name}
          onChange={(value) => updateFormData({ name: value })}
          required
        />

        <FormInput
          label="Telefone Principal"
          type="tel"
          value={formData.phone}
          onChange={(value) => updateFormData({ phone: value })}
          required
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
  </div>
);

// Address Section
const AddressSection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}> = ({ formData, updateFormData }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <span className="text-green-600 text-sm font-bold">📍</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Endereço</h2>
          <p className="text-sm text-gray-600">Localização completa do seu negócio</p>
        </div>
      </div>
    </div>
    <div className="p-6">
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
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
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
  </div>
);

// Social Media Section
const SocialMediaSection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}> = ({ formData, updateFormData }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <span className="text-purple-600 text-sm font-bold">@</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Redes Sociais</h2>
          <p className="text-sm text-gray-600">Links das suas redes sociais</p>
        </div>
      </div>
    </div>
    <div className="p-6">
      <div className="space-y-4">
        <FormInput
          label="Instagram (URL)"
          type="url"
          value={formData.instagram}
          onChange={(value) => updateFormData({ instagram: value })}
          placeholder="https://instagram.com/seu_perfil"
          icon={<span className="text-pink-500">📷</span>}
        />

        <FormInput
          label="Facebook (URL)"
          type="url"
          value={formData.facebook}
          onChange={(value) => updateFormData({ facebook: value })}
          placeholder="https://facebook.com/seu_perfil"
          icon={<span className="text-blue-500">📘</span>}
        />

        <FormInput
          label="Website"
          type="url"
          value={formData.website}
          onChange={(value) => updateFormData({ website: value })}
          placeholder="https://seusite.com"
          icon={<span className="text-gray-500">🌐</span>}
        />
      </div>
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <span className="text-orange-600 text-sm font-bold">📷</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Galeria de Fotos</h2>
            <p className="text-sm text-gray-600">Máx. 6 fotos do seu negócio</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {formData.photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 transition-transform group-hover:scale-105"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {formData.photos.length < 6 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center hover:border-primary-400 transition-colors">
              <label className="cursor-pointer flex flex-col items-center text-gray-500 hover:text-primary-600">
                <span className="text-2xl mb-2">📷</span>
                <span className="text-sm font-medium">Adicionar</span>
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
    </div>
  );
};

// Payment Methods Section
const PaymentMethodsSection: React.FC<{
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}> = ({ formData, updateFormData }) => {
  const togglePaymentMethod = (method: string) => {
    try {
      const isSelected = formData.payment_methods.includes(method);
      const newMethods = isSelected
        ? formData.payment_methods.filter(m => m !== method)
        : [...formData.payment_methods, method];

      updateFormData({ payment_methods: newMethods });
    } catch (error) {
      console.error("Error toggling payment method:", error);
    }
  };

  const paymentOptions = [
    { key: "Dinheiro", icon: "💵", description: "Pagamento em espécie" },
    { key: "Cartão de Crédito", icon: "💳", description: "Visa, Mastercard, etc." },
    { key: "Cartão de Débito", icon: "💳", description: "Débito automático" },
    { key: "PIX", icon: "📱", description: "Transferência instantânea" },
    { key: "Vale Refeição", icon: "🎫", description: "Ticket restaurante" }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
            <span className="text-teal-600 text-sm font-bold">💰</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Formas de Pagamento</h2>
            <p className="text-sm text-gray-600">Selecione as opções aceitas</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentOptions.map(({ key, icon, description }) => {
            const isSelected = formData.payment_methods.includes(key);
            return (
              <button
                key={key}
                onClick={() => togglePaymentMethod(key)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${
                  isSelected ? "bg-primary-100" : "bg-white"
                }`}>
                  <span className="text-2xl">{icon}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{key}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary-600" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
              </button>
            );
          })}
        </div>
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 text-sm font-bold">🕐</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Horário de Funcionamento</h2>
            <p className="text-sm text-gray-600">Configure seus horários de atendimento</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {formData.working_hours.map((day, index) => (
            <div key={day.day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
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
                    className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  />
                  <span className="text-gray-500">até</span>
                  <input
                    type="time"
                    value={day.intervals[0]?.end || "18:00"}
                    onChange={(e) => updateWorkingHour(index, 'end', e.target.value)}
                    className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Reminders Section
const RemindersSection: React.FC<{
  currentBusiness: any;
  updateBusiness: (updates: any) => Promise<void>;
}> = ({ currentBusiness, updateBusiness }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
          <span className="text-yellow-600 text-sm font-bold">🔔</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Configurações de Lembretes</h2>
          <p className="text-sm text-gray-600">Configure quando enviar lembretes automaticamente</p>
        </div>
      </div>
    </div>
    <div className="p-6">
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
  </div>
);

// Main Settings Component
const Settings: React.FC = () => {
  const { currentBusiness, updateBusiness, uploadBusinessPhoto } = useApp();
  const { formData, updateFormData, saving, setSaving, error, setError } = useSettingsState(currentBusiness);

  const handleSave = async () => {
    if (!currentBusiness?.id) return;

    setSaving(true);
    setError(null);
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
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setError(error.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (!currentBusiness) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600 mt-1">Personalize as configurações do seu negócio</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-70 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Erro ao salvar</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Sections */}
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