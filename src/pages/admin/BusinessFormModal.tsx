import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Business } from '../../types';

interface BusinessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (business: Partial<Business>) => void;
  business: Partial<Business> | null;
  isSaving: boolean;
}

const BusinessFormModal: React.FC<BusinessFormModalProps> = ({ isOpen, onClose, onSave, business, isSaving }) => {
  const [formData, setFormData] = useState<Partial<Business>>({});

  useEffect(() => {
    if (isOpen) {
      if (business) {
        setFormData(business);
      } else {
        // Default for new business
        setFormData({
          name: '',
          type: 'Barbearia',
          plan: 'Básico',
          status: 'Ativo',
          subscription_status: 'trialing',
          phone: ''
        });
      }
    }
  }, [business, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {business?.id ? 'Editar Negócio' : 'Novo Negócio'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Negócio</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">WhatsApp (para cobrança)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={(e) => handleChange({
                  ...e,
                  target: { ...e.target, name: 'phone', value: e.target.value.replace(/\D/g, '') }
              })}
              placeholder="5511999999999"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                name="type"
                value={formData.type || 'Barbearia'}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option>Barbearia</option>
                <option>Salão de Beleza</option>
                <option>Clínica</option>
                <option>Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Plano</label>
              <select
                name="plan"
                value={formData.plan || 'Básico'}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="Básico">Básico</option>
                <option value="Profissional">Profissional</option>
                <option value="Empresarial">Empresarial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status do Negócio</label>
              <select
                name="status"
                value={formData.status || 'Ativo'}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status da Cobrança</label>
              <select
                name="billing_status"
                value={formData.billing_status || 'trial'}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="trial">Em Teste</option>
                <option value="active">Ativa</option>
                <option value="payment_pending">Pendente</option>
                <option value="blocked">Bloqueada</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessFormModal;