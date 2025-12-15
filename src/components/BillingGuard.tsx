import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useApp } from '../store';
import { Loader2, Lock } from 'lucide-react';

// Tela de bloqueio que será exibida sobre o conteúdo
const BlockedScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md animate-in fade-in zoom-in-95">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Lock className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Acesso Bloqueado</h2>
        <p className="text-gray-600 mt-2">Seu período de testes acabou ou sua assinatura está pendente.</p>
        <p className="text-gray-600 mt-1">Por favor, acesse a página de assinatura para regularizar sua situação e continuar usando o sistema.</p>
        <Link to="/manager/billing" className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
          Ver Assinatura
        </Link>
      </div>
    </div>
  );
};


export const BillingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentBusiness, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  // Se não há negócio (pode ser um admin ou erro), não bloqueia.
  if (!currentBusiness) {
    return <>{children}</>;
  }

  const trialEndsAt = currentBusiness.trial_ends_at ? new Date(currentBusiness.trial_ends_at) : new Date(0);
  const isTrialExpired = trialEndsAt < new Date();
  const isActive = currentBusiness.billing_status === 'active';

  // Se o trial expirou e a assinatura não está ativa, bloqueia.
  const isBlocked = isTrialExpired && !isActive;

  // Permite acesso à página de billing mesmo bloqueado.
  if (isBlocked && location.pathname !== '/manager/billing') {
    return <BlockedScreen />;
  }

  return <>{children}</>;
};