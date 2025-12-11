import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { Clock, Calendar as CalendarIcon, X, Save, ChevronLeft, ChevronRight, CheckCircle, DollarSign, Send, Loader2, Filter } from "lucide-react";
import { Appointment, AppointmentStatus } from "../../types";

type ViewType = "day" | "week" | "month";

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Schedule: React.FC = () => {
  const { appointments, services, professionals, rescheduleAppointment, updateAppointmentStatus, completeAppointment, sendDailyReminders } = useApp();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Reminder State
  const [sendingReminders, setSendingReminders] = useState(false);

  // Form States
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [paymentAmount, setPaymentAmount] = useState<number | string>("");

  // Filter States
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // UI State
  const [copiedPhone, setCopiedPhone] = useState(false);

  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 9); // 9am to 7pm

  useEffect(() => {
    if (selectedAppointment) {
      const service = services.find(s => s.id === selectedAppointment.service_id);
      setPaymentAmount(service?.price || 0);
    }
  }, [selectedAppointment, services]);

  const handleAppointmentClick = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setNewDate(appt.date);
    setNewTime(appt.time);
    setIsRescheduling(false);
    setIsRegisteringPayment(false);
  };

  const handleCancelAppointment = async () => {
    if (selectedAppointment && window.confirm("Tem certeza que deseja cancelar este agendamento?")) {
      await updateAppointmentStatus(selectedAppointment.id, AppointmentStatus.CANCELLED);
      setSelectedAppointment(null);
    }
  };

  const handleCompleteAppointment = async () => {
    if (selectedAppointment && paymentMethod && paymentAmount) {
      await completeAppointment(selectedAppointment.id, paymentMethod, Number(paymentAmount));
      setSelectedAppointment(null);
    }
  };

  const handleSaveReschedule = () => {
    if (selectedAppointment && newDate && newTime) {
      rescheduleAppointment(selectedAppointment.id, newDate, newTime);
      setIsRescheduling(false);
      setSelectedAppointment(null);
    }
  };

  const handleSendReminders = async () => {
    if (!window.confirm("Isso enviará uma mensagem no WhatsApp para TODOS os clientes agendados para HOJE. Deseja continuar?")) {
        return;
    }
    
    setSendingReminders(true);
    try {
        const result = await sendDailyReminders();
        const sentCount = result.processed?.filter((r: any) => r.status === 'sent').length || 0;
        alert(`${sentCount} lembretes enviados com sucesso!`);
    } catch (error: any) {
        console.error(error);
        alert("Erro ao enviar lembretes: " + error.message);
    } finally {
        setSendingReminders(false);
    }
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "day") newDate.setDate(currentDate.getDate() - 1);
    if (view === "week") newDate.setDate(currentDate.getDate() - 7);
    if (view === "month") newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === "day") newDate.setDate(currentDate.getDate() + 1);
    if (view === "week") newDate.setDate(currentDate.getDate() + 7);
    if (view === "month") newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getAppointmentsForDate = (dateStr: string) => {
    let filtered = appointments.filter(a => a.date === dateStr);
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    } else {
      // Default: hide cancelled appointments
      filtered = filtered.filter(a => a.status !== AppointmentStatus.CANCELLED);
    }
    
    return filtered;
  };

  const getAppointmentsForHour = (dateStr: string, hour: number) => {
    return getAppointmentsForDate(dateStr).filter((appt) => {
      const apptHour = parseInt(appt.time.split(":")[0]);
      return apptHour === hour;
    });
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.COMPLETED: return 'border-green-500 bg-green-50';
      case AppointmentStatus.CANCELLED: return 'border-red-500 bg-red-50 opacity-60';
      case AppointmentStatus.PENDING: return 'border-yellow-500 bg-yellow-50';
      case AppointmentStatus.CONFIRMED: return 'border-primary-500 bg-primary-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getServiceInfo = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? { name: service.name, price: service.price } : { name: 'Serviço não encontrado', price: 0 };
  };

  const DayView = () => (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {timeSlots.map((hour) => (
        <div key={hour} className="group flex min-h-[100px] border-b border-gray-100 last:border-0">
          <div className="w-20 border-r border-gray-100 p-4 text-center text-sm font-medium text-gray-500">
            {hour}:00
          </div>
          <div className="flex flex-1 gap-4 p-2 relative">
            <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-100 pointer-events-none"></div>
            {getAppointmentsForHour(toLocalDateString(currentDate), hour).map((appt) => {
              const serviceInfo = getServiceInfo(appt.service_id);
              return (
                <button 
                  key={appt.id} 
                  onClick={() => handleAppointmentClick(appt)} 
                  className={`relative z-10 flex w-full max-w-[300px] flex-col rounded-lg border-l-4 p-3 text-xs hover:shadow-md transition-shadow text-left ${getStatusColor(appt.status)}`}
                >
                  <div className="flex items-center gap-1 font-bold text-gray-800 mb-1">
                    <Clock className="h-3 w-3" />{appt.time}
                  </div>
                  <div className="font-semibold text-gray-900 mb-1">{appt.client_name}</div>
                  <div className="text-gray-600 mb-1">{appt.client_phone}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 truncate">{serviceInfo.name}</span>
                    <span className="font-medium text-gray-700 ml-2">R$ {serviceInfo.price.toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const WeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header with days */}
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
          <div className="p-4 text-center text-sm font-semibold text-gray-600 border-r border-gray-200">Horário</div>
          {weekDays.map((day, index) => {
            const isToday = toLocalDateString(day) === toLocalDateString(new Date());
            return (
              <div key={index} className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-primary-50' : ''}`}>
                <div className={`text-sm font-medium ${isToday ? 'text-primary-700' : 'text-gray-600'}`}>
                  {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-primary-800' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100 last:border-0 min-h-[80px]">
            <div className="p-4 text-center text-sm font-medium text-gray-500 border-r border-gray-200 flex items-center justify-center">
              {hour}:00
            </div>
            {weekDays.map((day) => {
              const dateStr = toLocalDateString(day);
              const hourAppts = getAppointmentsForHour(dateStr, hour);
              
              return (
                <div key={day.getTime()} className="p-2 border-r border-gray-200 last:border-r-0 space-y-1">
                  {hourAppts.slice(0, 2).map((appt) => {
                    const serviceInfo = getServiceInfo(appt.service_id);
                    return (
                      <button 
                        key={appt.id} 
                        onClick={() => handleAppointmentClick(appt)} 
                        className={`block w-full text-left p-2 rounded border-l-4 text-xs hover:shadow-sm transition-shadow ${getStatusColor(appt.status)}`}
                      >
                        <div className="font-semibold text-gray-900 truncate">{appt.client_name}</div>
                        <div className="text-gray-600 truncate">{serviceInfo.name}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-500">{appt.time}</span>
                          <span className="font-medium text-gray-700">R$ {serviceInfo.price.toFixed(2)}</span>
                        </div>
                      </button>
                    );
                  })}
                  {hourAppts.length > 2 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{hourAppts.length - 2} mais
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const MonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOffset = firstDayOfMonth.getDay();
    const emptySlots = Array.from({ length: startDayOffset });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...emptySlots, ...days];

    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {totalSlots.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="border-b border-r border-gray-100 bg-gray-50/30 h-40"></div>;
            const dateStr = toLocalDateString(new Date(year, month, day));
            const dayAppts = getAppointmentsForDate(dateStr);
            const isToday = toLocalDateString(new Date()) === dateStr;
            return (
              <div key={day} className="flex h-40 flex-col border-b border-r border-gray-100 p-2 hover:bg-gray-50 transition-colors">
                <span className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-primary-600 text-white' : 'text-gray-700'}`}>{day}</span>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayAppts.slice(0, 3).map((appt) => {
                    const serviceInfo = getServiceInfo(appt.service_id);
                    return (
                      <button 
                        key={appt.id} 
                        onClick={() => handleAppointmentClick(appt)} 
                        className={`block w-full text-left p-1.5 rounded text-xs hover:shadow-sm transition-shadow ${getStatusColor(appt.status).replace('border-l-4', 'border-l-2')}`}
                      >
                        <div className="font-medium text-gray-900 truncate text-xs">{appt.client_name}</div>
                        <div className="text-gray-600 truncate text-xs">{serviceInfo.name}</div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-gray-500 text-xs">{appt.time}</span>
                          <span className="font-medium text-gray-700 text-xs">R$ {serviceInfo.price.toFixed(2)}</span>
                        </div>
                      </button>
                    );
                  })}
                  {dayAppts.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-0.5">
                      +{dayAppts.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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

    const serviceInfo = getServiceInfo(selectedAppointment.service_id);

    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Cliente</p>
          <p className="text-base font-semibold text-gray-900">{selectedAppointment.client_name}</p>
          <p className="text-sm text-gray-600">{selectedAppointment.client_phone}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Profissional</p>
          <p className="text-base text-gray-900">{professionals.find(p => p.id === selectedAppointment.professional_id)?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Serviço</p>
          <p className="text-base text-gray-900">{serviceInfo.name}</p>
          <p className="text-sm text-gray-600">R$ {serviceInfo.price.toFixed(2)}</p>
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
        <div>
          <p className="text-sm font-medium text-gray-500">Status</p>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(selectedAppointment.status).replace('border-l-4', '')}`}>{selectedAppointment.status}</span>
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
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
            
            {/* View Toggles */}
            <div className="hidden sm:flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              <button onClick={() => setView('day')} className={`rounded px-3 py-1 text-sm font-medium ${view === 'day' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Dia</button>
              <button onClick={() => setView('week')} className={`rounded px-3 py-1 text-sm font-medium ${view === 'week' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Semana</button>
              <button onClick={() => setView('month')} className={`rounded px-3 py-1 text-sm font-medium ${view === 'month' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Mês</button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
                onClick={handleSendReminders}
                disabled={sendingReminders}
                className="hidden sm:flex items-center rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-70"
            >
                {sendingReminders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar Lembretes Hoje
            </button>

            <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm border border-gray-200">
                <button onClick={goToPrevious} className="rounded p-1 hover:bg-gray-100"><ChevronLeft className="h-5 w-5 text-gray-600" /></button>
                <div className="min-w-[140px] text-center text-sm font-medium text-gray-900">
                {view === 'day' && currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {view === 'week' && `Semana de ${currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`}
                {view === 'month' && currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={goToNext} className="rounded p-1 hover:bg-gray-100"><ChevronRight className="h-5 w-5 text-gray-600" /></button>
            </div>
          </div>
        </div>
        
        {/* Mobile Reminder Button */}
        <button
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="mb-4 flex w-full sm:hidden items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-70"
        >
            {sendingReminders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar Lembretes Hoje
        </button>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
                  className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value={AppointmentStatus.PENDING}>Pendente</option>
                  <option value={AppointmentStatus.CONFIRMED}>Confirmado</option>
                  <option value={AppointmentStatus.COMPLETED}>Concluído</option>
                  <option value={AppointmentStatus.CANCELLED}>Cancelado</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {statusFilter === 'all' ? 'Mostrando todos' : `Filtrando: ${statusFilter}`}
            </div>
          </div>
        </div>

        {view === 'day' && <DayView />}
        {view === 'week' && <WeekView />}
        {view === 'month' && <MonthView />}
        {/* WeekView can be added here if needed */}

        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {isRescheduling ? "Reagendar" : isRegisteringPayment ? "Registrar Pagamento" : "Detalhes"}
                </h2>
                <button onClick={() => setSelectedAppointment(null)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
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