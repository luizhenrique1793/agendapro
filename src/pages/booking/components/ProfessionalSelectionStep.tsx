import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Professional } from '../../../types';

interface ProfessionalSelectionStepProps {
  professionals: Professional[];
  onSelectPro: (pro: Professional) => void;
  onBack: () => void;
}

export const ProfessionalSelectionStep: React.FC<ProfessionalSelectionStepProps> = ({ professionals, onSelectPro, onBack }) => {
  return (
    <div className="p-6 sm:p-8">
      <button
        onClick={onBack}
        className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
      </button>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Escolha o profissional
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {professionals.map((pro) => (
          <button
            key={pro.id}
            onClick={() => onSelectPro(pro)}
            className="flex flex-col items-center rounded-xl border border-gray-200 p-6 text-center transition-all hover:border-primary-500 hover:bg-primary-50"
          >
            <img
              src={pro.avatarUrl}
              alt={pro.name}
              className="mb-4 h-20 w-20 rounded-full object-cover"
            />
            <h3 className="font-semibold text-gray-900">{pro.name}</h3>
            <p className="text-sm text-gray-500">{pro.role}</p>
          </button>
        ))}
      </div>
    </div>
  );
};