import React, { useState, useEffect } from 'react';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { useApp } from '../../store';
import { Plan } from '../../types';
import { CreditCard, Loader2, CheckCircle, AlertTriangle, Send, Info } from 'lucide-react';

const Billing: React.FC = () => {
  const { currentBusiness, plans, updateBusiness, requestBusinessActivation, loading: appLoading } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentBusiness && plans.length > 0) {
      const plan = plans.find(p => p.name === currentBusiness.plan);
      setSelectedPlan(plan || null);
    }
  }, [currentBusiness, plans]);

  const handlePlanSelect = async (planName: string) => {
    const plan = plans.find(p => p.name === planName);
    if (plan) {
      setSelectedPlan(plan);
      try {
        await updateBusiness({ plan: plan.name });
        alert('Plano atualizado com sucesso!');
      } catch (e: any) {
        setError('Erro ao atualizar o plano: ' + e.message);
      }
    }
  };

  const handleRequestActivation = async () => {
    if (!window.confirm("Isso enviará uma notificação para nossa equipe analisar seu pedido de liberação. Deseja continuar?")) {
      return;
    }
    setIsRequesting(true);
    setError(null);
    try {
      await requestBusinessActivation();
    } catch (e: any) {
      setError('Erro ao solicitar liberação: ' + e.message);
    } finally {
      setIsRequesting(false);
    }
  };

  const trialDaysRemaining = () => {
    if (!currentBusiness?.trial_ends_at) return 0;
    const diff = new Date(currentBusiness.trial_ends_at).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isTrialActive = currentBusiness?.billing_status === 'trial' && trialDaysRemaining() > 0;
  const isPending = currentBusiness?.billing_status === 'payment_pending';
  const hasRequested = !!currentBusiness?.activation_requested_at;

  if (appLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  const renderStatusSpecificContent = () => {
    if (isPending) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
            <Send className="text-primary-600" /> Ativar Assinatura
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Seu período de testes terminou. Para continuar usando o sistema, solicite a liberação manual para nossa equipe.
          </p>
          {hasRequested ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-semibold text-blue-800">Pedido de liberação enviado!</h3>
              <p className="text-sm text-blue-700">Nossa equipe está analisando seu pedido. A liberação ocorrerá em breve.</p>
            </div>
          ) : (
            <button onClick={handleRequestActivation} disabled={isRequesting} className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {isRequesting ? <Loader2 className="animate-spin" /> : <Send />}
              Solicitar Liberação Manual
            </button>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assinatura e Pagamento</h1>
          <p className="text-gray-500 mb-8">Gerencie seu plano e pagamentos do AgendaPro.</p>

          {isPending && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <h3 className="font-bold flex items-center gap-2"><AlertTriangle /> Conta Pendente</h3>
              <p>Sua conta está com o pagamento pendente. Solicite a liberação para continuar usando todas as funcionalidades.</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* Plan Selection */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="font-bold text-lg mb-4">Planos Disponíveis</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {plans.filter(p => p.active).map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.name)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${selectedPlan?.id === plan.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                    >
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xl font-extrabold text-gray-900 my-2">
                        R$ {(plan.price_cents / 100).toFixed(2)} <span className="text-sm font-normal text-gray-500">/mês</span>
                      </p>
                      <p className="text-xs text-gray-500">{plan.description}</p>
                      {selectedPlan?.id === plan.id && <div className="mt-3 text-xs font-bold text-primary-600 flex items-center gap-1"><CheckCircle size={14} /> Plano Selecionado</div>}
                    </button>
                  ))}
                </div>
              </div>

              {renderStatusSpecificContent()}
            </div>

            {/* Status Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Info /> Status da Conta</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-bold ${currentBusiness?.billing_status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {currentBusiness?.billing_status === 'active' ? 'Ativo' : isTrialActive ? 'Em Teste' : 'Pendente'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano Atual:</span>
                  <span className="font-bold text-gray-900">{currentBusiness?.plan || 'Nenhum'}</span>
                </div>
                {isTrialActive && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial termina em:</span>
                    <span className="font-bold text-gray-900">{trialDaysRemaining()} dias</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Próximo Vencimento:</span>
                  <span className="font-bold text-gray-900">{currentBusiness?.payment_due_at ? new Date(currentBusiness.payment_due_at).toLocaleDateString('pt-BR') : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Billing;