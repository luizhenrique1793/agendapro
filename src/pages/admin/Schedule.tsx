import React, { useState } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { Clock, Calendar as CalendarIcon, X, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Appointment } from "../../types";

type ViewType = "day" | "week" | "month";

const Schedule: React.FC = () => {
  const { appointments, rescheduleAppointment, professionals } = useApp();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [view, setView] = useState<ViewType>("day");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Reschedule Form State
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 9); // 9am to 7pm

  // Helpers for Date Navigation
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
    return appointments.filter(a => a.date === dateStr);
  };

  const getAppointmentsForHour = (dateStr: string, hour: number) => {
    return appointments.filter((appt) => {
      const apptHour = parseInt(appt.time.split(":")[0]);
      return appt.date === dateStr && apptHour === hour;
    });
  };

  const handleAppointmentClick = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setNewDate(appt.date);
    setNewTime(appt.time);
    setIsRescheduling(false);
  };

  const handleSaveReschedule = () => {
    if (selectedAppointment && newDate && newTime) {
      rescheduleAppointment(selectedAppointment.id, newDate, newTime);
      setIsRescheduling(false);
      setSelectedAppointment(null);
    }
  };

  // --- Views Components ---

  const DayView = () => {
    const dateStr = currentDate.toISOString().split("T")[0];
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {timeSlots.map((hour) => (
          <div
            key={hour}
            className="group flex min-h-[100px] border-b border-gray-100 last:border-0"
          >
            <div className="w-20 border-r border-gray-100 p-4 text-center">
              <span className="text-sm font-medium text-gray-500">
                {hour}:00
              </span>
            </div>
            <div className="flex flex-1 gap-4 p-2 relative">
              <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-100 pointer-events-none"></div>
              {getAppointmentsForHour(dateStr, hour).map((appt) => (
                <button
                  key={appt.id}
                  onClick={() => handleAppointmentClick(appt)}
                  className="relative z-10 flex w-full max-w-[250px] flex-col items-start rounded-lg border-l-4 border-primary-500 bg-primary-50 p-2 text-xs hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center gap-1 font-bold text-primary-900">
                    <Clock className="h-3 w-3" />
                    {appt.time}
                  </div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {appt.client_name}
                  </div>
                  <div className="text-gray-600">{appt.client_phone}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const WeekView = () => {
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid min-w-[800px] grid-cols-8 divide-x divide-gray-200">
          {/* Time Column */}
          <div className="col-span-1">
            <div className="h-12 border-b border-gray-200 bg-gray-50"></div>
            {timeSlots.map((hour) => (
              <div key={hour} className="flex h-24 items-center justify-center border-b border-gray-100 text-sm text-gray-500">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {weekDays.map((day) => {
            const dateStr = day.toISOString().split("T")[0];
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div key={dateStr} className="col-span-1">
                <div className={`flex h-12 flex-col items-center justify-center border-b border-gray-200 ${isToday ? 'bg-primary-50' : 'bg-gray-50'}`}>
                  <span className="text-xs font-medium uppercase text-gray-500">
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </span>
                  <span className={`text-sm font-bold ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="relative">
                  {timeSlots.map((hour) => (
                    <div key={`${dateStr}-${hour}`} className="h-24 border-b border-gray-100 p-1">
                      {getAppointmentsForHour(dateStr, hour).map((appt) => (
                        <button
                          key={appt.id}
                          onClick={() => handleAppointmentClick(appt)}
                          className="mb-1 w-full rounded border-l-2 border-primary-500 bg-primary-100 p-1 text-[10px] hover:bg-primary-200 text-left"
                        >
                          <span className="font-bold">{appt.time}</span> {appt.client_name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const MonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOffset = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

    // Create empty slots for days before the 1st
    const emptySlots = Array.from({ length: startDayOffset }, (_, i) => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...emptySlots, ...days];

    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="py-2 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {totalSlots.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="border-b border-r border-gray-100 bg-gray-50/30 h-32"></div>;

            const dateObj = new Date(year, month, day);
            const dateStr = dateObj.toISOString().split("T")[0];
            const dayAppts = getAppointmentsForDate(dateStr);
            const isToday = new Date().toDateString() === dateObj.toDateString();

            return (
              <div key={day} className="flex h-32 flex-col border-b border-r border-gray-100 p-2 hover:bg-gray-50 transition-colors">
                <span className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm ${isToday ? 'bg-primary-600 text-white font-bold' : 'text-gray-700'}`}>
                  {day}
                </span>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayAppts.map((appt) => (
                    <button
                      key={appt.id}
                      onClick={() => handleAppointmentClick(appt)}
                      className="block w-full truncate rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800 hover:bg-blue-200 text-left"
                    >
                      {appt.time} {appt.client_name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
            <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setView('day')}
                className={`rounded px-3 py-1 text-sm font-medium ${view === 'day' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Dia
              </button>
              <button
                onClick={() => setView('week')}
                className={`rounded px-3 py-1 text-sm font-medium ${view === 'week' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Semana
              </button>
              <button
                onClick={() => setView('month')}
                className={`rounded px-3 py-1 text-sm font-medium ${view === 'month' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Mês
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm border border-gray-200">
            <button onClick={goToPrevious} className="rounded p-1 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="min-w-[140px] text-center text-sm font-medium text-gray-900">
              {view === 'day' && currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {view === 'week' && `Semana de ${currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`}
              {view === 'month' && currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={goToNext} className="rounded p-1 hover:bg-gray-100">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {view === 'day' && <DayView />}
        {view === 'week' && <WeekView />}
        {view === 'month' && <MonthView />}

        {/* Details/Reschedule Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {isRescheduling ? "Reagendar Horário" : "Detalhes do Agendamento"}
                </h2>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!isRescheduling ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cliente</p>
                    <p className="text-base font-semibold text-gray-900">{selectedAppointment.client_name}</p>
                    <p className="text-sm text-gray-600">{selectedAppointment.client_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Profissional</p>
                    <p className="text-base text-gray-900">
                      {professionals.find(p => p.id === selectedAppointment.professional_id)?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data</p>
                      <p className="text-base text-gray-900">
                        {new Date(selectedAppointment.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Horário</p>
                      <p className="text-base text-gray-900">{selectedAppointment.time}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {selectedAppointment.status}
                    </span>
                  </div>

                  <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setIsRescheduling(true)}
                      className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 flex items-center justify-center"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Reagendar
                    </button>
                    <button
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nova Data</label>
                    <input
                      type="date"
                      value={newDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Novo Horário</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setIsRescheduling(false)}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleSaveReschedule}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 flex items-center justify-center"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Schedule;