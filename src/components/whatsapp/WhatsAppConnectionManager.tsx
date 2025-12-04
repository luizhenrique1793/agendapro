import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle2, AlertTriangle, Power, QrCode, Copy, Eye, EyeOff, Save, Link as LinkIcon } from 'lucide-react';

type InstanceStatus = 'loading' | 'no_instance' | 'created' | 'connecting' | 'connected' | 'error';

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  api_key?: string;
  status: string;
  qr_code?: string;
  phone_number?: string;
}

export const WhatsAppConnectionManager: React.FC = () => {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [status, setStatus] = useState<InstanceStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form State
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newApiKey, setNewApiKey] = useState("");

  const checkEvolutionStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        method: 'GET',
      });

      if (error) {
        // Only reset if specifically not found (404-like behavior from logic)
        if (data && data.status === 'no_instance') {
            setStatus('no_instance');
            setInstance(null);
        }
        return;
      }

      setInstance(data);
      if (data.status === 'open') {
        setStatus('connected');
      } else if (data.status === 'connecting' && data.qr_code) {
        setStatus('connecting');
      } else {
        setStatus('created');
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setStatus('loading');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .limit(1)
        .single();

      if (error || !data) {
        setStatus('no_instance');
      } else {
        setInstance(data);
        if (data.status === 'open') {
          setStatus('connected');
        } else if (data.qr_code) {
          setStatus('connecting');
        } else {
          setStatus('created');
        }
        checkEvolutionStatus();
      }
    };
    init();
  }, [checkEvolutionStatus]);

  useEffect(() => {
    if (status === 'connecting' || status === 'created') {
      const interval = setInterval(checkEvolutionStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [status, checkEvolutionStatus]);

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim() || !newApiKey.trim()) {
      setError("Preencha o nome da instância e a API Key.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        method: 'POST',
        body: { 
            instanceName: newInstanceName,
            apiKey: newApiKey 
        }
      });
      
      if (error) throw new Error(error.message || "Erro ao conectar.");
      if (data.error) throw new Error(data.error);
      
      setInstance(data);
      setStatus(data.status === 'open' ? 'connected' : 'created');
      setNewInstanceName(""); 
      setNewApiKey("");
    } catch (err: any) {
      console.error("Erro conexão:", err);
      let msg = err.message || 'Erro ao conectar instância.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGetQRCode = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        method: 'PUT', 
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setInstance(prev => ({ ...prev!, qr_code: data.qr_code, status: 'connecting' }));
      setStatus('connecting');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar QR Code.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!window.confirm("Tem certeza que deseja desconectar esta instância?")) return;
    setActionLoading(true);
    try {
      await supabase.functions.invoke('whatsapp-manager', { method: 'DELETE' });
      setInstance(null);
      setStatus('no_instance');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado!");
  };

  if (status === 'loading') {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (status === 'no_instance') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Conectar WhatsApp</h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">
            Insira os dados da sua instância criada na Evolution API.
            </p>
        </div>

        <form onSubmit={handleManualConnect} className="max-w-md mx-auto space-y-4">
            <div>
                <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700 text-left">Nome da Instância</label>
                <input 
                    type="text" 
                    id="instanceName"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    placeholder="Ex: MinhaBarbearia"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                />
            </div>
            
            <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 text-left">Instance API Key</label>
                <input 
                    type="text" 
                    id="apiKey"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="Cole a chave da instância aqui"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={actionLoading}
                className="w-full flex justify-center items-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-70 mt-6"
            >
                {actionLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LinkIcon className="mr-2 h-5 w-5" />}
                Salvar e Conectar
            </button>
        </form>

        {error && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                {error}
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center p-1.5">
             <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-full w-full" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{instance?.instance_name}</h3>
            <p className="text-xs text-gray-500">Conectado via Evolution API</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          {status === 'connected' ? 'Conectado' : status === 'connecting' ? 'Conectando...' : 'Aguardando'}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* API Key Section */}
        <div className="bg-gray-900 rounded-lg p-4">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">API Key Configurada</label>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 font-mono text-sm text-green-400 truncate">
              {showApiKey ? instance?.api_key : '•'.repeat(40)}
            </code>
            <button onClick={() => setShowApiKey(!showApiKey)} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button onClick={() => copyToClipboard(instance?.api_key || '')} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Connection Area */}
        {status === 'connected' ? (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">WhatsApp Conectado</p>
                <p className="text-sm text-green-700">{instance?.phone_number || 'Número vinculado'}</p>
              </div>
            </div>
            <button
              onClick={handleDeleteInstance}
              disabled={actionLoading}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              {actionLoading ? 'Processando...' : 'Desconectar'}
            </button>
          </div>
        ) : status === 'connecting' && instance?.qr_code ? (
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <img src={`data:image/png;base64,${instance.qr_code}`} alt="QR Code" className="h-48 w-48" />
            </div>
            <div className="text-center md:text-left max-w-sm">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Escaneie o QR Code</h4>
              <p className="text-sm text-gray-600 mb-4">
                Abra o WhatsApp no seu celular, vá em <strong>Configurações {'>'} Aparelhos conectados {'>'} Conectar aparelho</strong> e aponte a câmera.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando leitura...
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-6 bg-yellow-50 rounded-lg border border-yellow-100">
            <div>
              <h4 className="font-bold text-yellow-900">Aguardando Conexão</h4>
              <p className="text-sm text-yellow-700 mt-1">Instância configurada. Se ainda não conectou, gere o QR Code.</p>
            </div>
            <button
              onClick={handleGetQRCode}
              disabled={actionLoading}
              className="flex items-center bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-yellow-700 transition-colors shadow-sm disabled:opacity-70"
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
              Gerar QR Code
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {status !== 'no_instance' && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
           <button onClick={handleDeleteInstance} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
             <Power className="h-3 w-3" /> Remover Configuração
           </button>
        </div>
      )}
    </div>
  );
};