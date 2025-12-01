
import React, { useState } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { Save, Calendar, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useApp } from "../../store";

const Settings: React.FC = () => {
  const { googleCalendarConnected, toggleGoogleCalendar } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleGoogleConnect = () => {
    if (!googleCalendarConnected) {
      setIsSyncing(true);
      // Simulate API call to OAuth
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

          <div className="space-y-6">
             {/* Integrations Section */}
             <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Integrações</h2>
                  <p className="text-sm text-gray-500">Conecte ferramentas externas ao seu AgendaPro.</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                      <p className="text-sm text-gray-500">
                        Sincronize seus agendamentos automaticamente com sua agenda Google.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleGoogleConnect}
                    disabled={isSyncing}
                    className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      googleCalendarConnected
                        ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isSyncing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : googleCalendarConnected ? (
                      <span className="flex items-center">
                        Desconectar
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Conectar Conta
                      </span>
                    )}
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
                  <input type="text" defaultValue="Barbearia do Zé" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input type="text" defaultValue="(11) 98765-4321" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700">Endereço</label>
                  <input type="text" defaultValue="Rua das Tesouras, 123, São Paulo - SP" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
              </div>
            </div>

             {/* Hours */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Horário de Funcionamento</h2>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Segunda a Sexta</span>
                    <div className="flex gap-2">
                         <input type="time" defaultValue="09:00" className="rounded-md border-gray-300 text-sm" />
                         <span className="self-center text-gray-500">às</span>
                         <input type="time" defaultValue="20:00" className="rounded-md border-gray-300 text-sm" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Sábado</span>
                    <div className="flex gap-2">
                         <input type="time" defaultValue="09:00" className="rounded-md border-gray-300 text-sm" />
                         <span className="self-center text-gray-500">às</span>
                         <input type="time" defaultValue="18:00" className="rounded-md border-gray-300 text-sm" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Domingo</span>
                    <div className="flex gap-2">
                         <span className="text-sm text-gray-500 italic">Fechado</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex justify-end">
               <button className="flex items-center rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-500">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
               </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
