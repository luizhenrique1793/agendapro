
import React from "react";
import { Link } from "react-router-dom";
import { AdminSidebar } from "../../components/AdminSidebar";
import { useApp } from "../../store";
import { Plus, Edit2, Lock, Power, ChevronLeft, ChevronRight } from "lucide-react";

const Users: React.FC = () => {
  const { users } = useApp();

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <Link
            to="/admin/users/new"
            className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo usuário
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                placeholder="Filtrar por nome"
                className="rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                placeholder="Filtrar por e-mail"
                className="rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Função</label>
              <select className="rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500">
                <option>Todas</option>
                <option>Admin</option>
                <option>Dono</option>
                <option>Profissional</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Negócio vinculado
              </label>
              <input
                type="text"
                placeholder="Filtrar por negócio"
                className="rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">E-mail (login)</th>
                <th scope="col" className="px-6 py-3">Função</th>
                <th scope="col" className="px-6 py-3">Negócio vinculado</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b bg-white hover:bg-gray-50 last:border-0"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4">{user.businessName}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                        user.status === "Ativo"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.status === "Ativo" ? "bg-green-600" : "bg-red-600"
                        }`}
                      ></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-500 hover:text-primary-600" title="Editar">
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 hover:text-red-600" title="Ativar/Desativar">
                        <Power className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 hover:text-primary-600" title="Resetar Senha">
                        <Lock className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <span className="text-sm text-gray-700">
              Mostrando 1-{users.length} de {users.length} usuários
            </span>
            <div className="flex items-center gap-2">
              <button disabled className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Users;
