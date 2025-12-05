import React from "react";
import { Clock } from "lucide-react";
import { Service } from "../../../types";

interface ServiceListProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ services, onSelectService }) => {
  return (
    <section id="services" className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Serviços Disponíveis</h2>
      <div className="grid gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-gray-500 text-sm mt-1">{service.description}</p>
              )}
              <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {service.duration} min
              </p>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-6">
              <span className="font-bold text-lg text-gray-900 whitespace-nowrap">
                R$ {service.price.toFixed(2)}
              </span>
              <button
                onClick={() => onSelectService(service)}
                className="px-6 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                Agendar
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Nenhum serviço cadastrado ainda.</p>
          </div>
        )}
      </div>
    </section>
  );
};