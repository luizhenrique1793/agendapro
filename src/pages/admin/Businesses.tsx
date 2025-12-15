import React, { useState } from "react";
import { AdminSidebar } from "../../components/AdminSidebar";
import { useApp } from "../../store";
import { PlusCircle, Search, Edit2, ChevronLeft, ChevronRight, Copy, CheckCircle2, Loader2, Bell, Filter, Trash2 } from "lucide-react";
import { Business } from "../../types";
import BusinessFormModal from "./BusinessFormModal";

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
    >
      {copied ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : text}
    </button>
  );
};

const getBillingStatusPill = (status: string | undefined) => {
  switch (status) {
    case 'active':
      return <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Ativo</span>;
    case 'trial':
      return <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Em Teste</span>;
    case 'payment_pending':
      return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Pendente</span>;
    case 'blocked':
        return <span className="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Bloqueado</span>;
    default:
      return <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">N/A</span>;
  }
};

const Businesses: React.FC = () => {
  const { businesses, adminUpdateBusiness, adminCreateBusiness, deleteBusiness, loading } = useApp();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [billingStatusFilter, setBillingStatusFilter] = useState("all");
  const [showOnlyRequests, setShowOnlyRequests] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Partial<Business> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'all' || business.plan === planFilter;
    const matchesBillingStatus = billingStatusFilter === 'all' || business.billing_status === billingStatusFilter;
    const matchesActivationRequest = !showOnlyRequests || (business.activation_requested_at && business.billing_status === 'payment_pending');
    return matchesSearch && matchesPlan && matchesBillingStatus && matchesActivationRequest;
  });

  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (business: Partial<Business> | null = null) => {
    setEditingBusiness(business);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBusiness(null);
  };

  const handleSaveBusiness = async (businessData: Partial<Business>) => {
    setIsSaving(true);
    try {
      if (businessData.id) {
        await adminUpdateBusiness(businessData);
      } else {
        await adminCreateBusiness(businessData);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save business:", error);
      alert("Erro ao salvar negócio.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este negócio? Todos os dados relacionados serão perdidos.")) {
      try {
        await deleteBusiness(id);
      } catch (error) {
        console.error("Failed to delete business:", error);
        alert("Erro ao excluir negócio.");
      }
    }
  };

  const handleStatusChange = async (businessId: string, newStatus: string) => {
    const updatePayload: Partial<Business> = { id: businessId, billing_status: newStatus as any };
    // Limpa o pedido de ativação ao aprovar (mudar para 'active')
    if (newStatus === 'active') {
        updatePayload.activation_requested_at = null;
    }
    await adminUpdateBusiness(updatePayload);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Negócios</h1>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo negócio
          </button>
        </div>

        <div className="mb-8 rounded-xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-900">Buscar por nome...</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite o nome do negócio"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Plano</label>
              <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500">
                <option value="all">Todos os Planos</option>
                <option value="Básico">Básico</option>
                <option value="Profissional">Profissional</option>
                <option value="Empresarial">Empresarial</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Status Cobrança</label>
              <select value={billingStatusFilter} onChange={e => setBillingStatusFilter(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500">
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="trial">Em Teste</option>
                <option value="payment_pending">Pendente</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={showOnlyRequests} onChange={() => setShowOnlyRequests(!showOnlyRequests)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-900 flex items-center gap-2"><Filter className="h-4 w-4" /> Mostrar apenas pedidos de liberação</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">Negócio</th>
                <th scope="col" className="px-6 py-3">WhatsApp</th>
                <th scope="col" className="px-6 py-3">Plano</th>
                <th scope="col" className="px-6 py-3">Status Cobrança</th>
                <th scope="col" className="px-6 py-3">Trial Termina em</th>
                <th scope="col" className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-600" /></td></tr>
              ) : paginatedBusinesses.map((business) => (
                <tr key={business.id} className="border-b bg-white hover:bg-gray-50 last:border-0">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {business.name}
                      {business.activation_requested_at && business.billing_status === 'payment_pending' && (
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1" title={`Pedido em ${new Date(business.activation_requested_at).toLocaleString()}`}>
                          <Bell className="h-3 w-3" /> Liberação Solicitada
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{business.phone ? <CopyButton text={business.phone} /> : <span className="text-red-500 text-xs">N/A</span>}</td>
                  <td className="px-6 py-4">{business.plan || 'N/A'}</td>
                  <td className="px-6 py-4">{getBillingStatusPill(business.billing_status)}</td>
                  <td className="px-6 py-4">{business.trial_ends_at ? new Date(business.trial_ends_at).toLocaleDateString('pt-BR') : 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <select
                        value={business.billing_status || ''}
                        onChange={(e) => handleStatusChange(business.id, e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-1.5 text-xs text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="active">Ativo</option>
                        <option value="payment_pending">Pendente</option>
                        <option value="blocked">Bloqueado</option>
                        <option value="trial">Em Teste</option>
                      </select>
                      <button onClick={() => handleOpenModal(business)} className="text-primary-600 hover:text-primary-900" title="Editar"><Edit2 className="h-5 w-5" /></button>
                      <button onClick={() => handleDeleteBusiness(business.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <span className="text-sm text-gray-700">Página {currentPage} de {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
              </div>
            </div>
          )}
        </div>
        <BusinessFormModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveBusiness}
          business={editingBusiness}
          isSaving={isSaving}
        />
      </main>
    </div>
  );
};

export default Businesses;