import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { 
  Calendar, 
  Clock, 
  Bell, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Filter,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import { Appointment, ReminderConfig } from "../../types";
import { supabase } from "../../lib/supabase";

interface ReminderInfo {
  appointment: Appointment;
  willBeSentAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
  isPreviousDay: boolean; // Se será enviado no dia anterior
}

const Reminders: React.FC = () => {
  const { appointments, currentBusiness, services, sendDailyReminders } = useApp();
  const [reminders, setReminders] = useState<ReminderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [sendingManual, setSendingManual] = useState<string | null>(null);

  useEffect(() => {
    if (currentBusiness) {
      loadReminders();
    }
  }, [currentBusiness, appointments]);

  // Verificação automática a cada 2 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndSendPendingReminders();
    }, 2 * 60 * 1000); // 2 minutos

    return () => clearInterval(interval);
  }, [reminders, currentBusiness]);

  const loadReminders = () => {
    setLoading(true);
    
    // Configuração padrão se não existir
    const defaultConfig: ReminderConfig = {
      same_day_enabled: true,
      previous_day_time: "19:00",
      early_threshold_hour: "09:00",
      previous_day_enabled: true,
      same_day_hours_before: 2
    };
    
    const config = currentBusiness?.reminder_config || defaultConfig;
    
    // Processar agendamentos para calcular quando os lembretes serão enviados
    const processedReminders: ReminderInfo[] = appointments
      .filter(appt => appt.status !== 'Cancelado' && appt.status !== 'Concluído')
      .map(appt => {
        // Criar data do agendamento de forma mais robusta
        const [year, month, day] = appt.date.split('-').map(Number);
        const [hours, minutes] = appt.time.split(':').map(Number);
        const apptDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
        const apptHour = hours;
        const earlyThreshold = parseInt(config.early_threshold_hour.split(':')[0]);
        
        let reminderTime: Date;
        let isPreviousDay = false;
        
        // Verificar se deve enviar no dia anterior
        if (config.previous_day_enabled && apptHour < earlyThreshold) {
          // Enviar no dia anterior no horário configurado
          const previousDay = new Date(year, month - 1, day - 1); // Dia anterior
          
          const [reminderHours, reminderMinutes] = config.previous_day_time.split(':').map(Number);
          previousDay.setHours(reminderHours, reminderMinutes, 0, 0);
          
          reminderTime = previousDay;
          isPreviousDay = true;
        } else if (config.same_day_enabled) {
          // Enviar no mesmo dia, X horas antes
          reminderTime = new Date(apptDateTime.getTime() - config.same_day_hours_before * 60 * 60 * 1000);
        } else {
          // Fallback: 2 horas antes
          reminderTime = new Date(apptDateTime.getTime() - 2 * 60 * 60 * 1000);
        }
        
        let status: 'pending' | 'sent' | 'failed' = 'pending';
        if (appt.reminder_sent) {
          status = 'sent';
        }
        
        return {
          appointment: appt,
          willBeSentAt: reminderTime,
          sentAt: appt.reminder_sent ? new Date() : undefined,
          status,
          isPreviousDay
        };
      })
      .sort((a, b) => a.willBeSentAt.getTime() - b.willBeSentAt.getTime());

    setReminders(processedReminders);
    setLoading(false);
  };

  const checkAndSendPendingReminders = async () => {
    if (!currentBusiness?.evolution_api_config) return;

    const now = new Date();
    const pendingReminders = reminders.filter(r => r.status === 'pending' && r.willBeSentAt < now);
    
    for (const reminder of pendingReminders) {
      try {
        const config = currentBusiness.evolution_api_config;
        const clientFirstName = reminder.appointment.client_name.split(' ')[0];
        const time = reminder.appointment.time.substring(0, 5);
        const serviceName = getServiceName(reminder.appointment.service_id);
        const businessName = currentBusiness?.name || 'Barbearia';
        const proName = reminder.appointment.professional_id ? ' com profissional' : '';
        
        let timeDescription;
        if (reminder.isPreviousDay) {
          timeDescription = 'amanhã';
        } else {
          timeDescription = 'hoje';
        }
        
        const message = `🔔 Lembrete Automático\n\nOlá ${clientFirstName}! Seu horário na *${businessName}* é ${timeDescription}, às *${time}*.\n\nServiço: ${serviceName}${proName}\n\nCaso não possa comparecer, por favor nos avise.`;

        const normalizedUrl = config.serverUrl.replace(/\/$/, "");
        const endpoint = `${normalizedUrl}/message/sendText/${config.instanceName}`;
        const cleanPhone = reminder.appointment.client_phone.replace(/\D/g, "");

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'apikey': config.apiKey, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: message,
            options: { delay: 1000 }
          })
        });

        if (response.ok) {
          // Atualizar status no banco
          await supabase
            .from('appointments')
            .update({ reminder_sent: true })
            .eq('id', reminder.appointment.id);
        }
      } catch (error) {
        console.error('Erro ao enviar lembrete automático:', error);
      }
    }
    
    // Recarregar lista após processar
    if (pendingReminders.length > 0) {
      loadReminders();
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'all') return true;
    return reminder.status === filter;
  });

  const toggleReminderDetails = (appointmentId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [appointmentId]: !prev[appointmentId]
    }));
  };

  const formatDateTime = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return "Data inválida";
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAppointmentDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) {
        return dateStr; // Retorna a string original se não conseguir parsear
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Não informado';
  };

  const getStatusIcon = (status: 'pending' | 'sent' | 'failed') => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: 'pending' | 'sent' | 'failed') => {
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'failed':
        return 'Falha';
      default:
        return 'Pendente';
    }
  };

  const sendManualReminder = async (appointment: Appointment) => {
    if (!currentBusiness?.evolution_api_config) {
      alert('WhatsApp não configurado para este negócio');
      return;
    }

    setSendingManual(appointment.id);
    try {
      const config = currentBusiness.evolution_api_config;
      const clientFirstName = appointment.client_name.split(' ')[0];
      const time = appointment.time.substring(0, 5);
      const serviceName = getServiceName(appointment.service_id);
      const businessName = currentBusiness?.name || 'Barbearia';
      const proName = appointment.professional_id ? ' com profissional' : '';
      
      // Verificar se é para amanhã ou hoje baseado na configuração
      const reminderConfig = currentBusiness?.reminder_config;
      const apptHour = parseInt(appointment.time.split(':')[0]);
      const earlyThreshold = parseInt((reminderConfig?.early_threshold_hour || "09:00").split(':')[0]);
      
      let timeDescription;
      if (reminderConfig?.previous_day_enabled && apptHour < earlyThreshold) {
        timeDescription = 'amanhã';
      } else {
        timeDescription = 'hoje';
      }
      
      const message = `🔔 Lembrete Manual\n\nOlá ${clientFirstName}! Seu horário na *${businessName}* é ${timeDescription}, às *${time}*.\n\nServiço: ${serviceName}${proName}\n\nCaso não possa comparecer, por favor nos avise.`;

      const normalizedUrl = config.serverUrl.replace(/\/$/, "");
      const endpoint = `${normalizedUrl}/message/sendText/${config.instanceName}`;
      const cleanPhone = appointment.client_phone.replace(/\D/g, "");

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'apikey': config.apiKey, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: message,
          options: { delay: 1000 }
        })
      });

      if (response.ok) {
        // Atualizar reminder_sent no banco após envio bem-sucedido
        await supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', appointment.id);
        
        // Recarregar lista para atualizar status
        loadReminders();
        alert('Lembrete enviado com sucesso!');
      } else {
        alert('Falha ao enviar lembrete');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar lembrete');
    } finally {
      setSendingManual(null);
    }
  };

  if (!currentBusiness) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Lembretes de Agendamento</h1>
          <p className="text-gray-500">
            Gerencie e visualize quando os lembretes serão enviados
          </p>
        </div>

        {/* Configuração Atual */}
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Configuração Atual de Lembretes</h3>
          <div className="text-sm text-blue-800">
            <p>
              <strong>Mesmo dia:</strong> {currentBusiness?.reminder_config?.same_day_enabled ? 
                `${currentBusiness.reminder_config.same_day_hours_before} horas antes` : 
                'Desativado'}
            </p>
            <p>
              <strong>Dia anterior:</strong> {currentBusiness?.reminder_config?.previous_day_enabled ? 
                `Para agendamentos antes das ${currentBusiness.reminder_config.early_threshold_hour}, enviar às ${currentBusiness.reminder_config.previous_day_time}` : 
                'Desativado'}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtrar:</span>
              <div className="flex gap-2">
                {(['all', 'pending', 'sent', 'failed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filter === f
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : 
                     f === 'pending' ? 'Pendentes' :
                     f === 'sent' ? 'Enviados' : 'Falhas'}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => sendDailyReminders()}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
            >
              <Send className="h-4 w-4" />
              Enviar Lembretes Hoje
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {reminders.length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="mt-1 text-2xl font-bold text-yellow-600">
                  {reminders.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Enviados</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {reminders.filter(r => r.status === 'sent').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Dia Anterior</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {reminders.filter(r => r.isPreviousDay).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Lista de Lembretes */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Carregando lembretes...</span>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum lembrete encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' ? 'Não há agendamentos com lembretes.' : `Não há lembretes ${filter}.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReminders.map((reminder) => (
                <div key={reminder.appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(reminder.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {reminder.appointment.client_name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            reminder.status === 'sent' ? 'bg-green-100 text-green-800' :
                            reminder.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {getStatusText(reminder.status)}
                          </span>
                          {reminder.isPreviousDay && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Dia Anterior
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatAppointmentDate(reminder.appointment.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{reminder.appointment.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span>
                              {reminder.status === 'sent' 
                                ? 'Lembrete enviado' 
                                : `Será enviado às ${formatDateTime(reminder.willBeSentAt)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Serviço:</span>
                            <span>{getServiceName(reminder.appointment.service_id)}</span>
                          </div>
                        </div>
                        
                        {showDetails[reminder.appointment.id] && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Detalhes do Agendamento</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Telefone:</span>
                                <p className="font-medium">{reminder.appointment.client_phone}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Profissional:</span>
                                <p className="font-medium">{reminder.appointment.professional_id ? 'Atribuído' : 'Não atribuído'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Status:</span>
                                <p className="font-medium">{reminder.appointment.status}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Tipo de Lembrete:</span>
                                <p className="font-medium">{reminder.isPreviousDay ? 'Dia Anterior' : 'Mesmo Dia'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleReminderDetails(reminder.appointment.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        {showDetails[reminder.appointment.id] ? 
                          <EyeOff className="h-5 w-5" /> : 
                          <Eye className="h-5 w-5" />
                        }
                      </button>
                      
                      {reminder.status === 'pending' && (
                        <button
                          onClick={() => sendManualReminder(reminder.appointment)}
                          disabled={sendingManual === reminder.appointment.id}
                          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-70"
                        >
                          {sendingManual === reminder.appointment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Enviar Agora
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reminders;