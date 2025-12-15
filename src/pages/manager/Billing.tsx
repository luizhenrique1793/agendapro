import React, { useState, useEffect } from 'react';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { useApp } from '../../store';
import { supabase } from '../../lib/supabase';
import { Plan } from '../../types';
import { CreditCard, Loader2, CheckCircle, AlertTriangle, QrCode } from 'lucide-react';

const Billing: React.FC = () => {
  const { currentBusiness, plans, updateBusiness, loading: appLoading } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleGenerateCheckout = async () => {
    if (!currentBusiness?.id) {
      setError("ID do negócio não encontrado.");
      return;
    }
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('create-abacatepay-charge', {
        body: { business_id: currentBusiness.id }
      });

      if (funcError) throw new Error(funcError.message);
      if (!data.success) throw new Error(data.error || "Erro desconhecido ao gerar cobrança.");

      if (data.payment?.payment_url) {
        window.location.href = data.payment.payment_url;
      } else {
        throw new Error("URL de checkout não recebida.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const trialDaysRemaining = () => {
    if (!currentBusiness?.trial_ends_at) return 0;
    const diff = new Date(currentBusiness.trial_ends_at).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isTrialActive = currentBusiness?.billing_status === 'trial' && trialDaysRemaining() > 0;
  const isBlocked = !isTrialActive && currentBusiness?.billing_status !== 'active';

  if (appLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assinatura e Pagamento</h1>
          <p className="text-gray-500 mb-8">Gerencie seu plano e pagamentos do AgendaPro.</p>

          {isBlocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <h3 className="font-bold flex items-center gap-2"><AlertTriangle /> Acesso Bloqueado</h3>
              <p>Seu período de testes terminou. Para continuar usando o sistema, por favor, realize o pagamento da sua assinatura.</p>
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
                      {selectedPlan?.id === plan.id && <div className="mt-3 text-xs font-bold text-primary-600 flex items-center gap-1"><CheckCircle size={14} /> Plano Atual</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Area */}
              {isBlocked && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h2 className="font-bold text-lg mb-2">Ativar Assinatura</h2>
                  <p className="text-sm text-gray-600 mb-4">Seu plano selecionado é o <strong>{selectedPlan?.name || 'Nenhum'}</strong>. Clique no botão abaixo para ir para a página de pagamento e ativar sua conta.</p>
                  <button onClick={handleGenerateCheckout} disabled={isGenerating || !selectedPlan} className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <CreditCard />}
                    Ir para Pagamento
                  </button>
                  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
              )}
            </div>

            {/* Status Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard /> Status da Conta</h2>
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