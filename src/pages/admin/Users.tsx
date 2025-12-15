import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminSidebar } from "../../components/AdminSidebar";
import { useApp } from "../../store";
import { Plus, Edit2, Lock, Power, ChevronLeft, ChevronRight, Search, Trash2, Eye, EyeOff, Save, X } from "lucide-react";
import { User } from "../../types";
import { supabase } from "../../lib/supabase";

// Modal para adicionar/editar usuário
const UserFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>, password?: string) => Promise<void>;
  user: Partial<User> | null;
  isSaving: boolean;
  businesses: any[];
}> = ({ isOpen, onClose, onSave, user, isSaving, businesses }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(user || {
        name: "",
        email: "",
        role: "Profissional",
        business_id: "",
        status: true,
      });
      setPassword("");
      setError(null);
    }
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave(formData, password);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar usuário.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {user?.id ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          {!user?.id && ( // Senha apenas para novos usuários
            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!user?.id}
                  className="block w-full rounded-md border-gray-300 pr-10 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Função</label>
            <select name="role" value={formData.role || 'Profissional'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <option value="Admin">Admin</option>
              <option value="Dono">Dono</option>
              <option value="Profissional">Profissional</option>
            </select>
          </div>
          {(formData.role === 'Dono' || formData.role === 'Profissional') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Negócio vinculado</label>
              <select name="business_id" value={formData.business_id || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="">Nenhum</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center">
            <input type="checkbox" name="status" checked={formData.status === undefined ? true : formData.status} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
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

const Users: React.FC = () => {
  const { users, businesses, loading, adminUpdateBusiness } = useApp(); // Adicionado adminUpdateBusiness para atualizar o status do usuário
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [businessFilter, setBusinessFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'Ativo' ? user.status : !user.status);
    const matchesBusiness = businessFilter === 'all' || user.business_id === businessFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesBusiness;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (user: Partial<User> | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (userData: Partial<User>, password?: string) => {
    setIsSaving(true);
    try {
      if (userData.id) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            business_id: userData.business_id,
            status: userData.status,
          })
          .eq('id', userData.id);
        if (error) throw error;

        // If email changed, update auth email
        if (userData.email && userData.email !== editingUser?.email) {
          const { error: authError } = await supabase.auth.admin.updateUserById(userData.id, { email: userData.email });
          if (authError) throw authError;
        }
      } else {
        // Create new user
        if (!password) throw new Error("Senha é obrigatória para novos usuários.");
        const { data, error } = await supabase.auth.admin.createUser({
          email: userData.email!,
          password: password,
          email_confirm: true, // Ou false, dependendo da política
          user_metadata: {
            full_name: userData.name,
          }
        });
        if (error) throw error;

        // Insert into public.users table
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user?.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          business_id: userData.business_id,
          status: userData.status,
        });
        if (insertError) throw insertError;
      }
      // Refetch data to update the list
      // This is a placeholder, ideally you'd have a way to trigger fetchData from useApp
      window.location.reload(); 
    } catch (error: any) {
      console.error("Failed to save user:", error);
      throw new Error(error.message || "Erro ao salvar usuário.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) {
      try {
        // Delete from public.users table
        const { error: dbError } = await supabase.from('users').delete().eq('id', id);
        if (dbError) throw dbError;

        // Delete from auth.users (requires service role key)
        const { error: authError } = await supabase.auth.admin.deleteUser(id);
        if (authError) throw authError;

        window.location.reload(); // Refresh data
      } catch (error: any) {
        console.error("Failed to delete user:", error);
        alert("Erro ao excluir usuário: " + error.message);
      }
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    if (window.confirm(`Tem certeza que deseja ${user.status ? 'desativar' : 'ativar'} o usuário ${user.name}?`)) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ status: !user.status })
          .eq('id', user.id);
        if (error) throw error;
        window.location.reload(); // Refresh data
      } catch (error: any) {
        console.error("Failed to toggle user status:", error);
        alert("Erro ao alterar status do usuário: " + error.message);
      }
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (window.confirm(`Tem certeza que deseja resetar a senha do usuário ${userEmail}? Um e-mail de recuperação será enviado.`)) {
      try {
        const { error } = await supabase.auth.admin.generateLink({
          type: 'password_reset',
          email: userEmail,
        });
        if (error) throw error;
        alert("E-mail de recuperação de senha enviado com sucesso!");
      } catch (error: any) {
        console.error("Failed to reset password:", error);
        alert("Erro ao resetar senha: " + error.message);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo usuário
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Nome/E-mail</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 pl-10 text-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Função</label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="all">Todas</option>
                <option value="Admin">Admin</option>
                <option value="Dono">Dono</option>
                <option value="Profissional">Profissional</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="all">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Negócio vinculado</label>
              <select value={businessFilter} onChange={(e) => setBusinessFilter(e.target.value)} className="rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="all">Todos</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
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
              {loading ? (
                <tr><td colSpan={6} className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-600" /></td></tr>
              ) : paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b bg-white hover:bg-gray-50 last:border-0"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4">{businesses.find(b => b.id === user.business_id)?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                        user.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.status ? "bg-green-600" : "bg-red-600"
                        }`}
                      ></span>
                      {user.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(user)} className="text-gray-500 hover:text-primary-600" title="Editar">
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleToggleUserStatus(user)} className="text-gray-500 hover:text-red-600" title={user.status ? "Desativar" : "Ativar"}>
                        <Power className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleResetPassword(user.id!, user.email!)} className="text-gray-500 hover:text-primary-600" title="Resetar Senha">
                        <Lock className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id!)} className="text-red-600 hover:text-red-900" title="Excluir">
                        <Trash2 className="h-5 w-5" />
                      </button>
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
        <UserFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          user={editingUser}
          isSaving={isSaving}
          businesses={businesses}
        />
      </main>
    </div>
  );
};

export default Users;