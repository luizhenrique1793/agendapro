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
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
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

  // Get appointments for current period (week or month)
  const getPeriodAppointments = () => {
    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'week') {
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDate.getDay());
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      // Month view
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    return appointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return apptDate >= startDate && apptDate <= endDate;
    }).filter(appt => {
      if (statusFilter === "all") return true;
      return appt.status === statusFilter;
    }).filter(appt => {
      if (!searchTerm) return true;
      return appt.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const periodAppointments = getPeriodAppointments();

  // Get appointments for specific day
  const getDayAppointments = (date: Date) => {
    return periodAppointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return apptDate.toDateString() === date.toDateString();
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
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

  // Generate month calendar days
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'week' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'month' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mês
              </button>
            </div>

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

        {/* Period Navigation */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <button
            onClick={() => navigatePeriod('prev')}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === 'week' 
              ? new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                })
              : currentDate.toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                })
            }
          </h2>
          
          <button
            onClick={() => navigatePeriod('next')}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'week' ? (
          /* Week View */
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
        ) : (
          /* Month View */
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Month days */}
            {generateMonthDays().map((date, index) => {
              const dayAppointments = getDayAppointments(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`min-h-[120px] rounded-lg border bg-white p-2 shadow-sm ${
                    isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  } ${!isCurrentMonth ? 'bg-gray-50' : ''}`}
                >
                  <div className={`mb-2 text-right text-sm font-medium ${
                    isToday ? 'text-primary-700' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((appt) => (
                      <div
                        key={appt.id}
                        onClick={() => handleAppointmentClick(appt)}
                        className={`cursor-pointer rounded border p-1 text-xs transition-colors hover:bg-gray-50 ${getStatusColor(appt.status)}`}
                      >
                        <p className="font-medium truncate text-xs">{appt.client_name}</p>
                        <p className="text-gray-600 text-xs">{appt.time}</p>
                      </div>
                    ))}
                    
                    {dayAppointments.length > 2 && (
                      <p className="text-center text-xs text-gray-500">
                        +{dayAppointments.length - 2}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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