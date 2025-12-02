import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              currentStep >= i ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            {i}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between px-1 text-xs text-gray-500">
        <span>Serviço</span>
        <span>Profissional</span>
        <span>Data/Hora</span>
        <span>Dados</span>
      </div>
    </div>
  );
};