import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, Phone } from 'lucide-react';
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
  // Inicialização dos estados (tenta recuperar do estado pai se existir, ou usa defaults)
  const [countryCode, setCountryCode] = useState("55");
  const [ddd, setDdd] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");

  // Helper: Formata o número visualmente enquanto digita (Ex: 9 9999-9999)
  const formatPhoneDisplay = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    const limit = digits.slice(0, 9); // Limita a 9 dígitos

    if (limit.length > 5) {
      // Formato: 9 9999-9999
      return limit.replace(/^(\d)(\d{4})(\d{0,4}).*/, '$1 $2-$3');
    } else if (limit.length > 1) {
       // Formato parcial: 9 9999
       return limit.replace(/^(\d)(\d{0,4})/, '$1 $2');
    }
    return limit;
  };

  // Helper: Atualiza o estado pai com o número completo concatenado
  useEffect(() => {
    // Remove formatação para pegar apenas dígitos do número
    const rawPhone = phoneDisplay.replace(/\D/g, '');
    
    // Concatena: CodPaís + DDD + Número
    // Exemplo: 55 + 44 + 999999999 = 5544999999999
    const fullNumber = `${countryCode}${ddd}${rawPhone}`;
    
    // Atualiza o estado pai que será enviado ao banco
    onClientDataChange('phone', fullNumber);
  }, [countryCode, ddd, phoneDisplay, onClientDataChange]);

  // Handler para input de número
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setPhoneDisplay(formatted);
  };

  // Handler genérico para inputs numéricos restritos (Country, DDD)
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string>>, 
    maxLength: number
  ) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    setter(val);
  };

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

      <div className="space-y-6">
        {/* Nome Completo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo
          </label>
          <div className="relative">
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

        {/* Telefone Segmentado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone / WhatsApp
          </label>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            {/* Campo 1: Código País */}
            <div className="w-20">
              <input
                type="text"
                value={countryCode}
                onChange={(e) => handleNumericInput(e, setCountryCode, 3)}
                className="block w-full rounded-lg border-gray-300 text-center shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="55"
              />
              <span className="mt-1 block text-center text-xs text-gray-500">
                Cód. País
              </span>
            </div>

            {/* Campo 2: DDD */}
            <div className="w-16">
              <input
                type="text"
                value={ddd}
                onChange={(e) => handleNumericInput(e, setDdd, 2)}
                className="block w-full rounded-lg border-gray-300 text-center shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="44"
              />
              <span className="mt-1 block text-center text-xs text-gray-500">
                DDD
              </span>
            </div>

            {/* Campo 3: Número */}
            <div className="flex-1 min-w-[160px]">
              <div className="relative">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                 </div>
                 <input
                    type="tel"
                    value={phoneDisplay}
                    onChange={handlePhoneChange}
                    className="block w-full rounded-lg border-gray-300 pl-9 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="9 9999-9999"
                 />
              </div>
              <span className="mt-1 block text-xs text-gray-500 ml-1">
                Número do celular
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onBook}
          disabled={!clientData.name || !ddd || !phoneDisplay || phoneDisplay.length < 10}
          className="rounded-lg bg-primary-600 px-8 py-3 font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50 transition-opacity"
        >
          Confirmar Agendamento
        </button>
      </div>
    </div>
  );
};