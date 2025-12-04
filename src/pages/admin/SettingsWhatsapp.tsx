import React, { useState } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { WhatsAppConnectionManager } from "../../components/whatsapp/WhatsAppConnectionManager";
import { supabase } from "../../lib/supabase";
import { Loader2 } from "lucide-react";

const SettingsWhatsapp: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleApiTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api-test');
      if (error) throw error;
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResult(`Erro: ${err.message}\n\nDetalhes: ${JSON.stringify(err, null, 2)}`);
    } finally {
      setIsTesting(false);
    }
  };

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
            
            {/* Ferramenta de Teste */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Diagnóstico da API</h2>
              <p className="text-sm text-gray-500 mb-4">Use este botão para verificar se o sistema consegue se comunicar com a Evolution API.</p>
              <button 
                onClick={handleApiTest} 
                disabled={isTesting}
                className="flex items-center rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Testar Conexão API
              </button>
              {testResult && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-800">Resultado do Teste:</h3>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">{testResult}</pre>
                </div>
              )}
            </div>

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