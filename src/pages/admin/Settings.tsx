import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { Save, Calendar, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useApp } from "../../store";
import { Business } from "../../types";

const defaultSchedule = [
  { day: "Segunda", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Terça", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Quarta", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Quinta", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Sexta", intervals: [{ start: "09:00", end: "20:00" }], active: true },
  { day: "Sábado", intervals: [{ start: "09:00", end: "18:00" }], active: true },
  { day: "Domingo", intervals: [], active: false },
];

const Settings: React.FC = () => {
  const { currentBusiness, updateBusiness, googleCalendarConnected, toggleGoogleCalendar } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Business>>({
    name: "",
    phone: "",
    address: "",
    working_hours: defaultSchedule,
  });

  useEffect(() => {
    if (currentBusiness) {
      setFormData({
        name: currentBusiness.name || "",
        phone: currentBusiness.phone || "",
        address: currentBusiness.address || "",
        working_hours: currentBusiness.working_hours && currentBusiness.working_hours.length > 0 ? currentBusiness.working_hours : defaultSchedule,
      });
    }
  }, [currentBusiness]);

  const handleInputChange = (field: keyof Business, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (dayIndex: number, intervalIndex: number, field: 'start' | 'end', value: string) => {
    const newSchedule = [...(formData.working_hours || [])];
    newSchedule[dayIndex].intervals[intervalIndex][field] = value;
    setFormData({ ...formData, working_hours: newSchedule });
  };

  const addInterval = (dayIndex: number) => {
    const newSchedule = [...(formData.working_hours || [])];
    newSchedule[dayIndex].intervals.push({ start: "09:00", end: "18:00" });
    setFormData({ ...formData, working_hours: newSchedule });
  };

  const removeInterval = (dayIndex: number, intervalIndex: number) => {
    const newSchedule = [...(formData.working_hours || [])];
    newSchedule[dayIndex].intervals.splice(intervalIndex, 1);
    setFormData({ ...formData, working_hours: newSchedule });
  };

  const toggleDayActive = (dayIndex: number) => {
    const newSchedule = [...(formData.working_hours || [])];
    newSchedule[dayIndex].active = !newSchedule[dayIndex].active;
    setFormData({ ...formData, working_hours: newSchedule });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBusiness(formData);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Ocorreu um erro ao salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleConnect = () => {
    if (!googleCalendarConnected) {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        toggleGoogleCalendar();
      }, 1500);
    } else {
      toggleGoogleCalendar();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-2xl font-bold text-gray-900">Configurações</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Integrations Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Integrações</h2>
              <p className="text-sm text-gray-500">Conecte ferramentas externas ao seu AgendaPro.</p>
              <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                      <p className="text-sm text-gray-500">Sincronize seus agendamentos com sua agenda Google.</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleGoogleConnect} disabled={isSyncing} className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${googleCalendarConnected ? "border border-red-200 bg-white text-red-600 hover:bg-red-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : googleCalendarConnected ? "Desconectar" : "Conectar Conta"}
                  </button>
                </div>
                {googleCalendarConnected && (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Conta conectada: <b>barbearia.ze@gmail.com</b>. Sincronização ativa.</span>
                  </div>
                )}
              </div>
            </div>

            {/* General Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Informações do Negócio</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome do Negócio</label>
                  <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input type="text" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Endereço</label>
                  <input type="text" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Horário de Funcionamento</h2>
              <div className="space-y-4">
                {(formData.working_hours || []).map((day, dayIndex) => (
                  <div key={day.day} className="rounded-lg border border-gray-100 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={day.active} onChange={() => toggleDayActive(dayIndex)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="font-medium text-gray-700">{day.day}</span>
                      </div>
                      {day.active && (
                        <button type="button" onClick={() => addInterval(dayIndex)} className="text-xs text-primary-600 hover:text-primary-700">+ Adicionar intervalo</button>
                      )}
                    </div>
                    {day.active && (
                      <div className="space-y-2 pl-7">
                        {day.intervals.map((interval, intervalIndex) => (
                          <div key={intervalIndex} className="flex items-center gap-2">
                            <input type="time" value={interval.start} onChange={(e) => handleScheduleChange(dayIndex, intervalIndex, 'start', e.target.value)} className="rounded-md border-gray-300 text-sm" />
                            <span className="self-center text-gray-500">às</span>
                            <input type="time" value={interval.end} onChange={(e) => handleScheduleChange(dayIndex, intervalIndex, 'end', e.target.value)} className="rounded-md border-gray-300 text-sm" />
                            <button type="button" onClick={() => removeInterval(dayIndex, intervalIndex)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))}
                        {day.intervals.length === 0 && <p className="text-xs text-gray-400 italic">Nenhum intervalo. O dia está fechado.</p>}
                      </div>
                    )}
                    {!day.active && <p className="pl-7 text-sm text-gray-500 italic">Fechado</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isSaving} className="flex items-center rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-70">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;