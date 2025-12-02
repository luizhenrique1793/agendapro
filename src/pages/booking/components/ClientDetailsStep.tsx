import React from 'react';
import { ChevronLeft, User } from 'lucide-react';
import { Service, Professional } from '../../../types';

interface ClientDetailsStepProps {
  selectedService: Service | null;
  selectedPro: Professional | null;
  selectedDate: string;
  selectedTime: string;
  clientData: { name: string; phone: string; };
  onClientDataChange: (field: 'name' | 'phone', value: string) => void;
  onBack: () => void;
  onBook: () => void;
}

export const ClientDetailsStep: React.FC<ClientDetailsStepProps> = ({
  selectedService,
  selectedPro,
  selectedDate,
  selectedTime,
  clientData,
  onClientDataChange,
  onBack,
  onBook,
}) => {
  return (
    <div className="p-6 sm:p-8">
      <button
        onClick={onBack}
        className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
      </button>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Seus Dados
      </h2>

      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold text-gray-900">Resumo</h3>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Serviço:</span> {selectedService?.name}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Profissional:</span> {selectedPro?.name}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Data:</span> {selectedDate} às {selectedTime}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Total:</span> R$ {selectedService?.price.toFixed(2)}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome Completo
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={clientData.name}
              onChange={(e) => onClientDataChange('name', e.target.value)}
              className="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Seu nome"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Telefone / WhatsApp
          </label>
          <input
            type="tel"
            value={clientData.phone}
            onChange={(e) => onClientDataChange('phone', e.target.value)}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onBook}
          disabled={!clientData.name || !clientData.phone}
          className="rounded-lg bg-primary-600 px-8 py-3 font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
        >
          Confirmar Agendamento
        </button>
      </div>
    </div>
  );
};