import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle2, AlertTriangle, Power, ScanLine } from 'lucide-react';

type InstanceStatus = 'loading' | 'no_instance' | 'connecting' | 'connected' | 'error';

interface WhatsAppInstance {
  id: string;
  status: string;
  qr_code?: string;
  phone_number?: string;
}

export const WhatsAppConnectionManager: React.FC = () => {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [status, setStatus] = useState<InstanceStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  // Função para verificar o status da instância na Evolution API
  const checkEvolutionStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        method: 'GET',
      });

      if (error) {
        // Se a função retornar 404, significa que a instância foi limpa ou não existe mais.
        if (error.context?.status === 404) {
          setStatus('no_instance');
          setInstance(null);
        } else {
          throw error;
        }
      } else {
        setInstance(data);
        if (data.status === 'open') {
          setStatus('connected');
        } else {
          // Continua no estado de conexão se ainda não estiver 'open'
          setStatus('connecting');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao buscar status da instância.');
      setStatus('error');
    }
  }, []);

  // 1. Apenas verifica se a instância existe no nosso banco de dados ao carregar
  useEffect(() => {
    const fetchInstanceFromDB = async () => {
      setStatus('loading');
      const { data: user } = await supabase.auth.getUser();
      if (!user) {
        setStatus('error');
        setError("Usuário não autenticado.");
        return;
      }

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .limit(1)
        .single();

      if (error || !data) {
        setInstance(null);
        setStatus('no_instance');
      } else {
        setInstance(data);
        // Se a instância existe, verificamos o status real dela
        checkEvolutionStatus();
      }
    };

    fetchInstanceFromDB();
  }, [checkEvolutionStatus]);

  // 2. Inicia a verificação periódica APENAS se estivermos no estado 'connecting'
  useEffect(() => {
    if (status === 'connecting') {
      const interval = setInterval(checkEvolutionStatus, 5000); // Polling a cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [status, checkEvolutionStatus]);

  // 3. Função para CRIAR a instância (chama o POST)
  const handleCreateInstance = async () => {
    setStatus('loading');
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        method: 'POST',
      });
      if (error) throw error;
      // Após criar, o estado muda para 'connecting' e o polling começa
      setInstance(data);
      setStatus('connecting');
    } catch (err: any) {
      setError(err.message || 'Falha ao criar instância.');
      setStatus('error');
    }
  };

  // 4. Função para DESCONECTAR (chama o DELETE)
  const handleDisconnect = async () => {
    if (!window.confirm("Tem certeza que deseja desconectar sua conta do WhatsApp?")) return;
    
    setStatus('loading');
    setError(null);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-manager', {
        method: 'DELETE',
      });
      if (error) throw error;
      setStatus('no_instance');
      setInstance(null);
    } catch (err: any) {
      setError(err.message || 'Falha ao desconectar.');
      setStatus('error');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <div className="flex flex-col items-center text-center"><Loader2 className="h-10 w-10 animate-spin text-primary-600" /><p className="mt-2 text-sm text-gray-500">Verificando conexão...</p></div>;
      case 'error':
        return <div className="flex flex-col items-center text-center text-red-600"><AlertTriangle className="h-10 w-10" /><p className="mt-2 text-sm font-semibold">Ocorreu um erro</p><p className="text-xs">{error}</p></div>;
      case 'no_instance':
        return (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">Nenhuma conta conectada</h3>
            <p className="mt-1 text-sm text-gray-500">Clique no botão abaixo para gerar um QR Code e conectar seu WhatsApp.</p>
            <button onClick={handleCreateInstance} className="mt-4 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">
              <ScanLine className="mr-2 h-5 w-5" /> Conectar WhatsApp
            </button>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="flex-shrink-0 rounded-lg border p-2 bg-white">
              {instance?.qr_code ? (
                <img src={`data:image/png;base64,${instance.qr_code}`} alt="QR Code" className="h-48 w-48" />
              ) : (
                <div className="h-48 w-48 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /><p className="text-sm text-gray-500 ml-2">Gerando QR Code...</p></div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Escaneie para conectar</h3>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600">
                <li>Abra o WhatsApp no seu celular.</li>
                <li>Vá em <strong>Configurações</strong> &gt; <strong>Aparelhos conectados</strong>.</li>
                <li>Toque em <strong>Conectar um aparelho</strong>.</li>
                <li>Aponte a câmera para este QR Code.</li>
              </ol>
              <p className="mt-3 text-xs text-gray-500">Aguardando conexão... A página será atualizada automaticamente.</p>
            </div>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Conectado com sucesso!</h3>
                <p className="text-sm text-gray-600">Sua conta do WhatsApp está ativa e pronta para enviar mensagens.</p>
              </div>
            </div>
            <button onClick={handleDisconnect} className="flex items-center rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
              <Power className="mr-2 h-4 w-4" /> Desconectar
            </button>
          </div>
        );
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex min-h-[150px] items-center justify-center rounded-lg bg-gray-50 p-6">
        {renderContent()}
      </div>
    </div>
  );
};