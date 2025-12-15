
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../components/AdminSidebar";
import { useApp } from "../../store";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { User } from "../../types";

const UserForm: React.FC = () => {
  const { addUser } = useApp();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Profissional" as "Admin" | "Dono" | "Profissional",
    businessName: "Selecione um negócio",
    status: "Ativo" as "Ativo" | "Inativo",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      businessName: formData.businessName,
      status: formData.status,
    };
    addUser(newUser);
    navigate("/admin/users");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Criar Novo Usuário</h1>
            <Link
              to="/admin/users"
              className="flex items-center text-sm font-medium text-primary-600 hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar para a lista
            </Link>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nome do Usuário <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao.silva@email.com"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="block w-full rounded-lg border-gray-300 pr-10 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "Admin" | "Dono" | "Profissional",
                      })
                    }
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Dono">Owner (Dono)</option>
                    <option value="Profissional">Professional</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="business"
                  className="block text-sm font-medium text-gray-700"
                >
                  Negócio vinculado
                </label>
                <select
                  id="business"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option disabled>Selecione um negócio</option>
                  <option>Barbearia do Zé</option>
                  <option>Salão da Maria</option>
                  <option>Clínica Sorriso</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Este campo aparece apenas para os roles 'Owner' e 'Professional'.
                </p>
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700">Status</span>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="Ativo"
                      checked={formData.status === "Ativo"}
                      onChange={() => setFormData({ ...formData, status: "Ativo" })}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-900">Ativo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="Inativo"
                      checked={formData.status === "Inativo"}
                      onChange={() => setFormData({ ...formData, status: "Inativo" })}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-900">Inativo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                <Link
                  to="/admin/users"
                  className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="flex items-center justify-center rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserForm;
