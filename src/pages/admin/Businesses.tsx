import React, { useState } from "react";
import { AdminSidebar } from "../../components/AdminSidebar";
import { useApp } from "../../store";
import { PlusCircle, Search, Edit2, Power, ChevronLeft, ChevronRight, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { Business } from "../../types";
import BusinessFormModal from "./BusinessFormModal";

const CopyLinkButton: React.FC<{ slug: string }> = ({ slug }) => {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/#/book/${slug}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
    >
      {copied ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : "Copiar Link"}
    </button>
  );
};

const getSubscriptionStatusPill = (status: string | undefined) => {
  switch (status) {
    case 'active':
      return <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Ativa</span>;
    case 'trialing':
      return <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Em Teste</span>;
    case 'past_due':
      return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Pendente</span>;
    case 'canceled':
      return <span className="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Cancelada</span>;
    default:
      return <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">N/A</span>;
  }
};

const Businesses: React.FC = () => {
  const { businesses, adminUpdateBusiness, adminCreateBusiness, loading } = useApp();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Partial<Business> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || business.status === statusFilter;
    const matchesPlan = planFilter === 'all' || business.plan === planFilter;
    const matchesSubscription = subscriptionStatusFilter === 'all' || business.subscription_status === subscriptionStatusFilter;
    return matchesSearch && matchesStatus && matchesPlan && matchesSubscription;
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

  const handleToggleStatus = async (business: Business) => {
    const newStatus = business.status === 'Ativo' ? 'Inativo' : 'Ativo';
    if (window.confirm(`Tem certeza que deseja alterar o status de "${business.name}" para ${newStatus}?`)) {
      await adminUpdateBusiness({ id: business.id, status: newStatus });
    }
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
              <label className="mb-2 block text-sm font-medium text-gray-900">Status Assinatura</label>
              <select value={subscriptionStatusFilter} onChange={e => setSubscriptionStatusFilter(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500">
                <option value="all">Todos os Status</option>
                <option value="active">Ativa</option>
                <option value="trialing">Em Teste</option>
                <option value="past_due">Pendente</option>
                <option value="canceled">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">Plano</th>
                <th scope="col" className="px-6 py-3">Status Assinatura</th>
                <th scope="col" className="px-6 py-3">Link Público</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-600" /></td></tr>
              ) : paginatedBusinesses.map((business) => (
                <tr key={business.id} className="border-b bg-white hover:bg-gray-50 last:border-0">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{business.name}</td>
                  <td className="px-6 py-4">{business.plan || 'N/A'}</td>
                  <td className="px-6 py-4">{getSubscriptionStatusPill(business.subscription_status)}</td>
                  <td className="px-6 py-4">{business.slug && <CopyLinkButton slug={business.slug} />}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`mr-2 h-2.5 w-2.5 rounded-full ${business.status === "Ativo" ? "bg-green-500" : "bg-red-500"}`}></div>
                      {business.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => handleOpenModal(business)} className="text-primary-600 hover:text-primary-900" title="Editar"><Edit2 className="h-5 w-5" /></button>
                      <button onClick={() => handleToggleStatus(business)} className="text-gray-500 hover:text-red-600" title="Alterar Status"><Power className="h-5 w-5" /></button>
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