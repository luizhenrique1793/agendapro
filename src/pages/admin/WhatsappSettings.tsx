import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { supabase } from "../../lib/supabase";
import { Save, Loader2, MessageCircle, CheckCircle2, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { EvolutionApiConfig } from "../../types";

const WhatsappSettings: React.FC = () => {
  const { currentBusiness, updateBusiness } = useApp();
  
  const [config, setConfig] = useState<EvolutionApiConfig>({
    serverUrl: "",
    apiKey: "",
    instanceName: ""
  });
  
  const [status, setStatus] = useState<"idle" | "testing" | "connected" | "disconnected" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (currentBusiness?.evolution_api_config) {
      setConfig(currentBusiness.evolution_api_config);
      // Se já tem config salva, podemos assumir que estava configurado, 
      // mas seria ideal testar a conexão ao carregar. Vamos deixar como idle por enquanto.
    }
  }, [currentBusiness]);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("testing");
    setStatusMessage("Testando conexão com a instância...");

    try {
      // 1. Chama a Edge Function para testar
      const { data, error } = await supabase.functions.invoke('check-evolution-status', {
        body: config
      });

      if (error) throw new Error("Falha ao comunicar com o servidor de teste.");
      
      if (!data.success) {
        setStatus("error");
        setStatusMessage(data.error || "Não foi possível conectar à instância. Verifique a URL e a API Key.");
        return;
      }

      // Verifica o estado retornado pela Evolution API
      // Geralmente vem em data.data.instance.state ou data.data.state dependendo da versão exata
      const connectionState = data.data?.instance?.state || data.data?.state;

      if (connectionState === "open") {
        setStatus("connected");
        setStatusMessage("Instância conectada com sucesso!");
        
        // 2. Salva no banco de dados apenas se o teste passou (ou se o usuário forçar, mas aqui vamos salvar no sucesso)
        await updateBusiness({
          evolution_api_config: config
        });
        
      } else if (connectionState === "close") {
        setStatus("disconnected");
        setStatusMessage("Instância encontrada, mas está desconectada (precisa ler QR Code).");
        // Salvamos mesmo assim, pois os dados estão corretos, só falta conectar o cel
        await updateBusiness({
          evolution_api_config: config
        });
      } else if (connectionState === "connecting") {
         setStatus("disconnected");
         setStatusMessage("A instância está tentando conectar...");
         await updateBusiness({
          evolution_api_config: config
        });
      } else {
        setStatus("error");
        setStatusMessage(`Status desconhecido: ${JSON.stringify(connectionState)}. Verifique o nome da instância.`);
      }

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setStatusMessage(err.message || "Erro interno ao testar conexão.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <MessageCircle className="h-6 w-6" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-gray-900">Integração WhatsApp</h1>
                <p className="text-gray-500">Conecte sua instância da Evolution API.</p>
             </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Configuração da Instância</h2>
            
            <form onSubmit={handleTestAndSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Server URL</label>
                <div className="mt-1">
                  <input 
                    type="url" 
                    placeholder="https://api.seuserver.com" 
                    required
                    value={config.serverUrl}
                    onChange={(e) => setConfig({...config, serverUrl: e.target.value})}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
                  />
                  <p className="mt-1 text-xs text-gray-500">A URL onde sua Evolution API está hospedada.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Authentication API Key (Global)</label>
                <div className="mt-1">
                  <input 
                    type="password" 
                    placeholder="Sua Global API Key" 
                    required
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da Instância</label>
                <div className="mt-1">
                  <input 
                    type="text" 
                    placeholder="Ex: n8n_curso" 
                    required
                    value={config.instanceName}
                    onChange={(e) => setConfig({...config, instanceName: e.target.value})}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
                  />
                  <p className="mt-1 text-xs text-gray-500">O nome exato da instância criada na Evolution API.</p>
                </div>
              </div>

              {/* Status Display */}
              {status !== "idle" && (
                <div className={`mt-4 rounded-lg p-4 flex items-start gap-3 ${
                  status === "connected" ? "bg-green-50 text-green-800" :
                  status === "error" ? "bg-red-50 text-red-800" :
                  status === "disconnected" ? "bg-yellow-50 text-yellow-800" :
                  "bg-blue-50 text-blue-800"
                }`}>
                  {status === "testing" && <Loader2 className="h-5 w-5 animate-spin mt-0.5" />}
                  {status === "connected" && <Wifi className="h-5 w-5 mt-0.5" />}
                  {status === "disconnected" && <WifiOff className="h-5 w-5 mt-0.5" />}
                  {status === "error" && <AlertCircle className="h-5 w-5 mt-0.5" />}
                  
                  <div>
                    <h3 className="font-semibold text-sm">
                      {status === "testing" ? "Testando..." :
                       status === "connected" ? "Conectado" :
                       status === "disconnected" ? "Desconectado" : "Erro"}
                    </h3>
                    <p className="text-sm mt-1">{statusMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={status === "testing"}
                  className="flex items-center rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-70"
                >
                  {status === "testing" ? (
                    <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Verificando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Testar e Salvar Configuração
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Help Section */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
             <h3 className="font-semibold text-gray-900 mb-2">Como encontrar esses dados?</h3>
             <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Acesse o painel da sua Evolution API.</li>
                <li>A <b>Server URL</b> é o endereço web onde você instalou a API.</li>
                <li>A <b>API Key</b> pode ser encontrada nas configurações globais ou arquivo env da API.</li>
                <li>Certifique-se que a instância já foi criada no painel da Evolution antes de conectar aqui.</li>
             </ul>
          </div>

        </div>
      </main>
    </div>
  );
};

export default WhatsappSettings;