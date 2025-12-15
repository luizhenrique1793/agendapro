import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  Scissors,
  Store,
  Users,
  MessageCircle,
  Bell,
  CreditCard
} from "lucide-react";
import { useApp } from "../store";
import { useAuth } from "../context/AuthContext";

export const ManagerSidebar: React.FC = () => {
  const location = useLocation();
  const { logout, currentBusiness } = useApp();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Business Manager Items
  const navItems = [
    { path: "/manager", label: "Meu Negócio", icon: LayoutDashboard },
    { path: "/manager/calendar", label: "Agenda", icon: Calendar },
    { path: "/manager/clients", label: "Clientes", icon: Users },
    { path: "/manager/professionals", label: "Profissionais", icon: Users },
    { path: "/manager/services", label: "Serviços", icon: Scissors },
    { path: "/manager/reminders", label: "Lembretes", icon: Bell },
    { path: "/manager/whatsapp", label: "WhatsApp API", icon: MessageCircle },
    { path: "/manager/billing", label: "Assinatura", icon: CreditCard },
    { path: "/manager/settings", label: "Configurações", icon: Settings },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Store className="mr-2 h-6 w-6 text-primary-600" />
        <span className="text-lg font-bold text-gray-900">AgendaPro</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Gestão do Negócio
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive(item.path)
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${isActive(item.path) ? "text-primary-600" : "text-gray-400"
                    }`}
                />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-4 flex items-center px-4">
          <img
            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'A'}&background=random`}
            alt="Dono"
            className="h-8 w-8 rounded-full"
          />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.user_metadata?.full_name || "Usuário"}</p>
            <p className="text-xs text-gray-500">{currentBusiness?.name || "Meu Negócio"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
};