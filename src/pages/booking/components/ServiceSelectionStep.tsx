import React from 'react';
import { Scissors } from 'lucide-react';
import { Service } from '../../../types';

interface ServiceSelectionStepProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ services, onSelectService }) => {
  return (
    <div className="p-6 sm:p-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Selecione um serviço
      </h2>
      <div className="grid gap-4">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelectService(service)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition-all hover:border-primary-500 hover:bg-primary-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Scissors className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {service.name}
                </p>
                <p className="text-sm text-gray-500">
                  {service.duration} minutos
                </p>
              </div>
            </div>
            <span className="font-bold text-gray-900">
              R$ {service.price.toFixed(2)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};