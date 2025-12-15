import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useApp } from '../store';
import { Loader2 } from 'lucide-react';

// Componente para a tela de bloqueio
const BlockedScreen: React.FC = () => {
  const location = useLocation();
  
  // Permite acesso à página de billing mesmo bloqueado
  if (location.pathname === '/manager/billing') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md">
        <h2 className="text-2xl font-bold text-gray-900">Acesso Bloqueado</h2>
        <p className="text-gray-600 mt-2">Seu período de testes acabou ou sua assinatura está pendente.</p>
        <p className="text-gray-600 mt-1">Por favor, acesse a página de assinatura para regularizar sua situação e continuar usando o sistema.</p>
        <Navigate to="/manager/billing" replace />
      </div>
    </div>
  );
};


export const BillingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentBusiness, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Se não há negócio, não há o que bloquear (pode ser um admin ou erro)
  if (!currentBusiness) {
    return <>{children}</>;
  }

  const trialEndsAt = currentBusiness.trial_ends_at ? new Date(currentBusiness.trial_ends_at) : new Date(0);
  const isTrialExpired = trialEndsAt < new Date();
  const isActive = currentBusiness.billing_status === 'active';

  // Se o trial expirou e a assinatura não está ativa, bloqueia
  if (isTrialExpired && !isActive) {
    // Redireciona para a página de billing se não estiver nela
    if (location.pathname !== '/manager/billing') {
      return <Navigate to="/manager/billing" replace />;
    }
  }

  return <>{children}</>;
};