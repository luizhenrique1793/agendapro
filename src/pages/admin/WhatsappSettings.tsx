import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { supabase } from "../../lib/supabase";
import { Save, Loader2, MessageCircle, CheckCircle2, AlertCircle, Wifi, WifiOff, Send, Phone, RefreshCw, AlertTriangle, Bug, BellRing } from "lucide-react";
import { EvolutionApiConfig } from "../../types";

const WhatsappSettings: React.FC = () => {
  const { currentBusiness, updateBusiness } = useApp();
  
  const [config, setConfig] = useState<EvolutionApiConfig>({
    serverUrl: "",
    apiKey: "",
    instanceName: ""
  });
  
  const [autoReminders, setAutoReminders] = useState(false);
  
  const [status, setStatus] = useState<"idle" | "testing" | "connected" | "disconnected" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<any>(null);

  // Test Message State
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    if (currentBusiness) {
      if (currentBusiness.evolution_api_config) {
        setConfig({
            serverUrl: currentBusiness.evolution_api_config.serverUrl || "",
            apiKey: currentBusiness.evolution_api_config.apiKey || "",
            instanceName: currentBusiness.evolution_api_config.instanceName || ""
        });
      }
      // @ts-ignore - Property added via SQL, might not be in types yet
      setAutoReminders(currentBusiness.automatic_reminders || false);
    }
  }, [currentBusiness]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    // Debug log
    console.log("---------------- DEBUG START ----------------");
    console.log("Tentando salvar configuração para o negócio ID:", currentBusiness?.id);
    
    const payload = { 
        evolution_api_config: config,
        // @ts-ignore
        automatic_reminders: autoReminders
    };
    
    console.log("Payload a ser enviado:", payload);

    try {
        if (!currentBusiness?.id) {
            throw new Error("ID do negócio não encontrado. Verifique se você está logado e vinculado a um negócio.");
        }

        // @ts-ignore
        await updateBusiness(payload);
        alert("Configurações salvas com sucesso!");
    } catch (error: any) {
        console.error("ERRO CRÍTICO AO SALVAR:", error);
        
        // Estrutura o erro para exibição
        setSaveError({
            message: error.message || "Erro desconhecido",
            details: error.details || null,
            hint: error.hint || null,
            code: error.code || null,
            stack: error.stack || null
        });
    } finally {
        setIsSaving(false);
        console.log("---------------- DEBUG END ----------------");
    }
  };

  const handleTestConnection = async () => {
    setStatus("testing");
    setStatusMessage("Testando conexão com a instância...");
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-evolution-status', {
        body: config
      });

      if (error) throw new Error(`Erro na Edge Function: ${error.message}`);
      
      if (!data.success) {
        setStatus("error");
        setStatusMessage(data.error || "Não foi possível conectar à instância. Verifique a URL e a API Key.");
        return;
      }

      const connectionState = data.data?.instance?.state || data.data?.state;

      if (connectionState === "open") {
        setStatus("connected");
        setStatusMessage("Instância conectada com sucesso!");
      } else if (connectionState === "close") {
        setStatus("disconnected");
        setStatusMessage("Instância encontrada, mas está desconectada (precisa ler QR Code).");
      } else if (connectionState === "connecting") {
         setStatus("disconnected");
         setStatusMessage("A instância está tentando conectar...");
      } else {
        setStatus("error");
        setStatusMessage(`Status desconhecido: ${JSON.stringify(connectionState)}.`);
      }

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setStatusMessage(err.message || "Erro interno ao testar conexão.");
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone) return;
    setSendingTest(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
            ...config,
            to: testPhone,
            message: "Olá! 👋 Este é um teste de envio do AgendaPro."
        }
      });

      if (error) throw new Error("Erro ao chamar função de envio.");

      if (data.success) {
        setTestResult({ success: true, message: "Mensagem enviada com sucesso!" });
      } else {
        setTestResult({ success: false, message: data.error || "Erro ao enviar mensagem." });
      }

    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setSendingTest(false);
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

          {/* Debug Error Box */}
          {saveError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
                    <div className="flex-1 overflow-hidden">
                        <h3 className="text-lg font-bold text-red-800">Erro ao Salvar Configurações</h3>
                        <p className="mt-1 font-medium">{saveError.message}</p>
                        
                        <div className="mt-3 rounded bg-white/50 p-3 text-xs font-mono">
                            {saveError.code && <p><strong>Code:</strong> {saveError.code}</p>}
                            {saveError.details && <p><strong>Details:</strong> {saveError.details}</p>}
                            {saveError.hint && <p><strong>Hint:</strong> {saveError.hint}</p>}
                            <p className="mt-2 text-gray-500">Abra o console do navegador (F12) para ver o log completo.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSaveError(null)}
                        className="text-red-500 hover:text-red-700"
                    >
                        Fechar
                    </button>
                </div>
            </div>
          )}

          <div className="grid gap-6">
            {/* Config Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Configuração da Instância</h2>
                    {currentBusiness?.id ? (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">ID: {currentBusiness.id.slice(0, 8)}...</span>
                    ) : (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                            <Bug className="h-3 w-3" /> Sem ID de Negócio
                        </span>
                    )}
                </div>
                
                <form className="space-y-6" onSubmit={(e) => handleSave(e)}>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
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
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">API Key (Global)</label>
                        <div className="mt-1">
                        <input 
                            type="password" 
                            placeholder="Global API Key" 
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
                        </div>
                    </div>
                </div>
                
                {/* Auto Reminders Toggle */}
                <div className="mt-6 border-t border-gray-100 pt-6">
                    <div className="flex items-start gap-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                        <BellRing className="mt-1 h-6 w-6 text-indigo-600" />
                        <div className="flex-1">
                            <h3 className="text-base font-semibold text-indigo-900">Lembretes Automáticos</h3>
                            <p className="mt-1 text-sm text-indigo-700">
                                Enviar mensagens automaticamente para os clientes 2 horas antes do agendamento.
                            </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input 
                                type="checkbox" 
                                className="peer sr-only" 
                                checked={autoReminders}
                                onChange={(e) => setAutoReminders(e.target.checked)}
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300"></div>
                        </label>
                    </div>
                </div>

                {/* Status Display */}
                {status !== "idle" && (
                    <div className={`rounded-lg p-4 flex items-start gap-3 ${
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

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button 
                        type="button" 
                        onClick={handleTestConnection}
                        disabled={status === "testing" || !config.serverUrl}
                        className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-70"
                    >
                        {status === "testing" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Testar Conexão
                    </button>

                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex items-center rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? "Salvando..." : "Salvar Configuração"}
                    </button>
                </div>
                </form>
            </div>

            {/* Test Message Card */}
            {(status === "connected" || currentBusiness?.evolution_api_config?.instanceName) && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <Send className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Teste de Envio</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        Envie uma mensagem de teste para verificar se o seu WhatsApp está disparando corretamente.
                    </p>

                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Número de Destino (com DDD)</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    className="block w-full rounded-lg border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="5511999999999"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSendTestMessage}
                            disabled={!testPhone || sendingTest}
                            className="flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-70"
                        >
                            {sendingTest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Enviar Teste
                        </button>
                    </div>

                    {testResult && (
                        <div className={`mt-4 rounded-md p-3 text-sm flex items-center gap-2 ${
                            testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                            {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {testResult.message}
                        </div>
                    )}
                </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default WhatsappSettings;