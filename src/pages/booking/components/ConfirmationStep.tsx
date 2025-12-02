import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

interface ConfirmationStepProps {
  clientName: string;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ clientName }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <h2 className="mb-2 text-3xl font-bold text-gray-900">
        Agendamento Confirmado!
      </h2>
      <p className="text-gray-600">
        Obrigado, {clientName}. Enviamos a confirmação para seu telefone.
      </p>
      <div className="mt-8">
        <Link
          to="/"
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};