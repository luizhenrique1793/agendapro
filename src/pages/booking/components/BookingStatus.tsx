import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';

interface BookingStatusProps {
  status: 'loading' | 'error';
}

export const BookingStatus: React.FC<BookingStatusProps> = ({ status }) => {
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600">Carregando informações do negócio...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-center">
        <div>
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Negócio não encontrado</h2>
          <p className="mt-2 text-gray-600">
            O link de agendamento parece estar incorreto.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return null;
};