import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle,
  X,
  Save,
  DollarSign,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { Appointment, AppointmentStatus } from "../../types";

const Schedule: React.FC = () => {
  const { appointments, services, professionals, updateAppointmentStatus, completeAppointment, rescheduleAppointment } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Get appointments for current week
  const getWeekAppointments = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return appointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return apptDate >= startOfWeek && apptDate <= endOfWeek;
    }).filter(appt => {
      if (statusFilter === "all") return true;
      return appt.status === statusFilter;
    }).filter(appt => {
      if (!searchTerm) return true;
      return appt.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const weekAppointments = getWeekAppointments();

  // Get appointments for specific day
  const getDayAppointments = (date: Date) => {
    return weekAppointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return apptDate.toDateString() === date.toDateString();
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return "bg-green-100 text-green-800 border-l-4 border-green-500";
      case AppointmentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500";
      case AppointmentStatus.COMPLETED:
        return "bg-blue-100 text-blue-800 border-l-4 border-blue-500";
      case AppointmentStatus.CANCELLED:
        return "bg-red-100 text-red-800 border-l-4 border-red-500";
      default:
        return "bg-gray-100 text-gray-800 border-l-4 border-gray-500";
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
    setIsRegisteringPayment(false);
    setIsRescheduling(false);
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;
    
    const amount = paymentAmount ? parseFloat(paymentAmount) : 0;
    await completeAppointment(selectedAppointment.id, paymentMethod, amount);
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    await updateAppointmentStatus(selectedAppointment.id, AppointmentStatus.CANCELLED);
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleSaveReschedule = async () => {
    if (!selectedAppointment || !newDate || !newTime) return;
    
    await rescheduleAppointment(selectedAppointment.id, newDate, newTime);
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const renderModalContent = () => {
    if (!selectedAppointment) return null;

    if (isRegisteringPayment) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor a Pagar (R$)</label>
            <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <option>Dinheiro</option>
              <option>Cartão de Crédito</option>
              <option>Cartão de Débito</option>
              <option>PIX</option>
            </select>
          </div>
          <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setIsRegisteringPayment(false)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Voltar</button>
            <button onClick={handleCompleteAppointment} className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 flex items-center justify-center"><DollarSign className="mr-2 h-4 w-4" />Confirmar Pagamento</button>
          </div>
        </div>
      );
    }

    if (isRescheduling) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nova Data</label>
            <input type="date" value={newDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setNewDate(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Novo Horário</label>
            <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setIsRescheduling(false)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Voltar</button>
            <button onClick={handleSaveReschedule} className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 flex items-center justify-center"><Save className="mr-2 h-4 w-4" />Confirmar</button>
          </div>
        </div>
      );
    }

    // Buscar informações do serviço
    const service = services.find(s => s.id === selectedAppointment.service_id);

    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Cliente</p>
          <p className="text-base font-semibold text-gray-900">{selectedAppointment.client_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Profissional</p>
          <p className="text-base text-gray-900">{professionals.find(p => p.id === selectedAppointment.professional_id)?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Serviço</p>
          <p className="text-base text-gray-900">{service?.name || 'N/A'}</p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Data</p>
            <p className="text-base text-gray-900">{new Date(selectedAppointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Horário</p>
            <p className="text-base text-gray-900">{selectedAppointment.time}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Valor</p>
            <p className="text-base font-semibold text-gray-900">R$ {service?.price.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(selectedAppointment.status).replace('border-l-4', '')}`}>{selectedAppointment.status}</span>
          </div>
        </div>
        {selectedAppointment.status !== AppointmentStatus.COMPLETED && selectedAppointment.status !== AppointmentStatus.CANCELLED && (
          <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setIsRegisteringPayment(true)} className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 flex items-center justify-center"><CheckCircle className="mr-2 h-4 w-4" />Concluir Agendamento</button>
            <div className="flex gap-3">
              <button onClick={() => setIsRescheduling(true)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center"><CalendarIcon className="mr-2 h-4 w-4" />Reagendar</button>
              <button onClick={handleCancelAppointment} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">Todos os status</option>
              <option value="Pendente">Pendente</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <button
            onClick={() => navigateWeek('prev')}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toLocaleDateString('pt-BR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          
          <button
            onClick={() => navigateWeek('next')}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Week Calendar */}
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() - currentDate.getDay() + i);
            const dayAppointments = getDayAppointments(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={i}
                className={`rounded-xl border bg-white p-4 shadow-sm ${
                  isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
              >
                <div className="mb-4 text-center">
                  <p className={`text-sm font-medium ${isToday ? 'text-primary-700' : 'text-gray-500'}`}>
                    {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-primary-700' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </p>
                </div>

                <div className="space-y-2">
                  {dayAppointments.slice(0, 3).map((appt) => (
                    <div
                      key={appt.id}
                      onClick={() => handleAppointmentClick(appt)}
                      className={`cursor-pointer rounded-lg border p-2 text-xs transition-colors hover:bg-gray-50 ${getStatusColor(appt.status)}`}
                    >
                      <p className="font-medium truncate">{appt.client_name}</p>
                      <p className="text-gray-600">{appt.time}</p>
                    </div>
                  ))}
                  
                  {dayAppointments.length > 3 && (
                    <p className="text-center text-xs text-gray-500">
                      +{dayAppointments.length - 3} mais
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Detalhes do Agendamento</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {renderModalContent()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Schedule;