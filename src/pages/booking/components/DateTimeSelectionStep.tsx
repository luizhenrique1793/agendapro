import React from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';

interface DateTimeSelectionStepProps {
  selectedDate: string;
  selectedTime: string;
  availableSlots: string[];
  loadingSlots: boolean;
  onDateChange: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const DateTimeSelectionStep: React.FC<DateTimeSelectionStepProps> = ({
  selectedDate,
  selectedTime,
  availableSlots,
  loadingSlots,
  onDateChange,
  onTimeSelect,
  onBack,
  onNext,
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
        Data e Horário
      </h2>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Selecione a data
          </label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Horários disponíveis
          </label>
          {loadingSlots ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : selectedDate && availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => onTimeSelect(time)}
                  className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : selectedDate ? (
            <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm font-semibold text-gray-700">
                Nenhum horário disponível.
              </p>
              <p className="text-xs text-gray-500">
                Por favor, selecione outra data.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">
                Selecione uma data para ver os horários.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!selectedDate || !selectedTime}
          className="rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};