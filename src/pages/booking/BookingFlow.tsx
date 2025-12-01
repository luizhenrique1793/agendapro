import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  User,
  Scissors,
} from "lucide-react";
import { useApp } from "../../store";
import { Service, Professional, AppointmentStatus } from "../../types";

const BookingFlow: React.FC = () => {
  const { services, professionals, addAppointment, loading } = useApp();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientData, setClientData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 9; i <= 18; i++) {
      slots.push(`${i < 10 ? "0" + i : i}:00`);
      slots.push(`${i < 10 ? "0" + i : i}:30`);
    }
    return slots;
  };

  const handleBooking = async () => {
    if (selectedService && selectedPro) {
      try {
        await addAppointment({
          clientId: "guest-client", // Placeholder, not used in DB currently
          clientName: clientData.name,
          clientPhone: clientData.phone,
          serviceId: selectedService.id,
          professionalId: selectedPro.id,
          date: selectedDate,
          time: selectedTime,
          status: AppointmentStatus.PENDING,
        });
        setStep(5);
      } catch (error) {
        console.error("Error booking appointment:", error);
        alert("Erro ao realizar agendamento. Tente novamente.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">AgendaPro</span>
          </Link>
          <span className="text-sm text-gray-500">Barbearia do João</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${step >= i
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-500"
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

        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Selecione um serviço
              </h2>
              <div className="grid gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
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
          )}

          {step === 2 && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setStep(1)}
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
                    onClick={() => {
                      setSelectedPro(pro);
                      setStep(3);
                    }}
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
          )}

          {step === 3 && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setStep(2)}
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
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                    }}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Horários disponíveis
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {generateTimeSlots().map((time) => (
                      <button
                        key={time}
                        disabled={!selectedDate}
                        onClick={() => setSelectedTime(time)}
                        className={`rounded-lg py-2 text-sm font-medium transition-colors ${selectedTime === time
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedDate || !selectedTime}
                  className="rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setStep(3)}
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
                      onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
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
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleBooking}
                  disabled={!clientData.name || !clientData.phone}
                  className="rounded-lg bg-primary-600 px-8 py-3 font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Agendamento Confirmado!
              </h2>
              <p className="text-gray-600">
                Obrigado, {clientData.name}. Enviamos a confirmação para seu telefone.
              </p>
              <div className="mt-8">
                <Link
                  to="/"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Voltar ao início
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookingFlow;
