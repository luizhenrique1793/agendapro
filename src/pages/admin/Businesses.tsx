import React, { useState } from "react";
import { AdminSidebar } from "../../components/AdminSidebar";
import { useApp } from "../../store";
import { PlusCircle, Search, Edit2, Power, Eye, ChevronLeft, ChevronRight, Copy, CheckCircle2 } from "lucide-react";

const CopyLinkButton: React.FC<{ slug: string }> = ({ slug }) => {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/#/book/${slug}`;

  const handleCopy = () => {
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

const Businesses: React.FC = () => {
  const { businesses } = useApp();

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Negócios</h1>
          <button className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo negócio
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-900">
                Buscar por nome...
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite o nome do negócio"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-900">
                Tipo de negócio
              </label>
              <select className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500">
                <option>Todos os tipos</option>
                <option>Barbearia</option>
                <option>Salão de Beleza</option>
                <option>Clínica</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-900">
                Status
              </label>
              <select className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500">
                <option>Todos</option>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">Tipo</th>
                <th scope="col" className="px-6 py-3">Link Público</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business) => (
                <tr
                  key={business.id}
                  className="border-b bg-white hover:bg-gray-50 last:border-0"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    {business.name}
                  </td>
                  <td className="px-6 py-4">{business.type}</td>
                  <td className="px-6 py-4">
                    {business.slug && <CopyLinkButton slug={business.slug} />}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`mr-2 h-2.5 w-2.5 rounded-full ${
                          business.status === "Ativo"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      ></div>
                      <span
                        className={`rounded px-2.5 py-0.5 text-xs font-medium ${
                          business.status === "Ativo"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {business.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button className="text-primary-600 hover:text-primary-900" title="Editar">
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 hover:text-red-600" title="Alterar Status">
                        <Power className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 hover:text-primary-600" title="Ver detalhes">
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
                1
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                2
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                3
            </button>
            <span className="text-gray-400">...</span>
             <button className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                10
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                <ChevronRight className="h-5 w-5" />
            </button>
        </div>
      </main>
    </div>
  );
};

export default Businesses;