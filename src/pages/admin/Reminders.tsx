import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { Bell, Send, CheckCircle, XCircle, Clock, Eye, EyeOff, Loader2 } from "lucide-react";

interface Reminder {
  id: string;
  appointment: {
    id: string;
    client_name: string;
    client_phone: string;
    service_name: string;
    professional_name: string;
    date: string;
    time: string;
  };
  status: 'sent' | 'failed' | 'pending';
  sentAt?: string;
  error?: string;
}

const Reminders: React.FC = () => {
  const { sendDailyReminders } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  const handleSendReminders = async () => {
    if (!window.confirm("Isso enviará lembretes para TODOS os agendamentos de hoje. Deseja continuar?")) {
      return;
    }

    setLoading(true);
    try {
      const result = await sendDailyReminders();
      // Process result and update reminders state
      console.log("Reminders sent:", result);
    } catch (error: any) {
      console.error("Error sending reminders:", error);
      alert("Erro ao enviar lembretes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminderDetails = (id: string) => {
    setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lembretes Automáticos</h1>
            <p className="text-gray-500">Gerencie lembretes de agendamento via WhatsApp</p>
          </div>
          <button
            onClick={handleSendReminders}
            disabled={loading}
            className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-70"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar Lembretes Hoje
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Histórico de Lembretes</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {reminders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Nenhum lembrete enviado ainda</p>
              </div>
            ) : (
              reminders.map((reminder) => (
                <div key={reminder.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`flex-shrink-0 ${reminder.status === 'sent' ? 'text-green-500' : reminder.status === 'failed' ? 'text-red-500' : 'text-yellow-500'}`}>
                        {reminder.status === 'sent' ? <CheckCircle className="h-6 w-6" /> : 
                         reminder.status === 'failed' ? <XCircle className="h-6 w-6" /> : 
                         <Clock className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {reminder.appointment.client_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {reminder.appointment.service_name} • {reminder.appointment.date} às {reminder.appointment.time}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleReminderDetails(reminder.appointment.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      {showDetails[reminder.appointment.id] ? 
                        <EyeOff className="h-5 w-5" /> : 
                        <Eye className="h-5 w-5" />
                      }
                    </button>
                  </div>
                  
                  {showDetails[reminder.appointment.id] && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className={`ml-2 ${reminder.status === 'sent' ? 'text-green-600' : reminder.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {reminder.status === 'sent' ? 'Enviado' : reminder.status === 'failed' ? 'Falhou' : 'Pendente'}
                          </span>
                        </div>
                        {reminder.sentAt && (
                          <div>
                            <span className="font-medium text-gray-700">Enviado em:</span>
                            <span className="ml-2 text-gray-600">{new Date(reminder.sentAt).toLocaleString()}</span>
                          </div>
                        )}
                        {reminder.error && (
                          <div className="col-span-2">
                            <span className="font-medium text-gray-700">Erro:</span>
                            <span className="ml-2 text-red-600">{reminder.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reminders;