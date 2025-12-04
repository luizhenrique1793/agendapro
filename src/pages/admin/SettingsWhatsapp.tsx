import React from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { WhatsAppConnectionManager } from "../../components/whatsapp/WhatsAppConnectionManager";

const SettingsWhatsapp: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Integração com WhatsApp</h1>
          <p className="mb-8 text-gray-500">
            Conecte sua conta do WhatsApp para enviar confirmações e lembretes automáticos aos seus clientes.
          </p>

          <div className="grid gap-8">
            <WhatsAppConnectionManager />
            
            {/* Placeholder para futuras configurações */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm opacity-50">
              <h2 className="text-lg font-bold text-gray-900">Automações</h2>
              <p className="text-sm text-gray-500 mb-4">Configure o envio automático de mensagens.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="confirm-toggle" className="text-sm font-medium text-gray-700">Enviar confirmação de agendamento</label>
                  <div className="h-6 w-11 rounded-full bg-gray-200"></div>
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="reminder-toggle" className="text-sm font-medium text-gray-700">Enviar lembrete 24h antes</label>
                  <div className="h-6 w-11 rounded-full bg-gray-200"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsWhatsapp;