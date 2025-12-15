import React, { useState } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { useApp } from '../../store';
import { Plan } from '../../types';
import { PlusCircle, Edit, Trash, Loader2, Save, X } from 'lucide-react';

const PlanModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Partial<Plan>) => void;
  plan: Partial<Plan> | null;
  isSaving: boolean;
}> = ({ isOpen, onClose, onSave, plan, isSaving }) => {
  const [formData, setFormData] = useState<Partial<Plan>>({});

  React.useEffect(() => {
    if (isOpen) {
      setFormData(plan || { name: '', price_cents: 0, description: '', active: true });
    }
  }, [plan, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // @ts-ignore
    const val = isCheckbox ? e.target.checked : value;
    setFormData(prev => ({ ...prev, [name]: name === 'price_cents' ? parseInt(val) : val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{plan?.id ? 'Editar Plano' : 'Novo Plano'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Plano</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Preço (em centavos)</label>
            <input type="number" name="price_cents" value={formData.price_cents || 0} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div className="flex items-center">
            <input type="checkbox" name="active" checked={formData.active === true} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <label className="ml-2 block text-sm text-gray-900">Ativo</label>
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Plans: React.FC = () => {
  const { plans, addPlan, updatePlan, deletePlan, loading } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = (plan: Partial<Plan> | null = null) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSavePlan = async (planData: Partial<Plan>) => {
    setIsSaving(true);
    try {
      if (planData.id) {
        await updatePlan(planData);
      } else {
        await addPlan(planData as Omit<Plan, 'id' | 'created_at' | 'updated_at'>);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save plan:", error);
      alert("Erro ao salvar plano.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este plano?")) {
      try {
        await deletePlan(id);
      } catch (error) {
        alert("Erro ao excluir plano.");
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Planos de Assinatura</h1>
          <button onClick={() => handleOpenModal()} className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Plano
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">Preço</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-600" /></td></tr>
              ) : plans.map((plan) => (
                <tr key={plan.id} className="border-b bg-white hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{plan.name}</td>
                  <td className="px-6 py-4">R$ {(plan.price_cents / 100).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {plan.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => handleOpenModal(plan)} className="text-primary-600 hover:text-primary-900" title="Editar"><Edit className="h-5 w-5" /></button>
                      <button onClick={() => handleDeletePlan(plan.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PlanModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSavePlan} plan={editingPlan} isSaving={isSaving} />
      </main>
    </div>
  );
};

export default Plans;