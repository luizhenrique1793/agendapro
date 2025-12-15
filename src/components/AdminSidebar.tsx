import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  BarChart2,
  LogOut,
  ShieldCheck,
  DollarSign
} from "lucide-react";
import { useApp } from "../store";

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useApp();

  const isActive = (path: string) => location.pathname === path;

  // Platform Admin Items
  const navItems = [
    { path: "/admin", label: "Visão Geral", icon: LayoutDashboard },
    { path: "/admin/businesses", label: "Negócios", icon: Store },
    { path: "/admin/users", label: "Usuários", icon: Users },
    { path: "/admin/plans", label: "Planos", icon: DollarSign },
    { path: "/admin/reports", label: "Relatórios Plataforma", icon: BarChart2 },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <ShieldCheck className="mr-2 h-6 w-6 text-indigo-600" />
        <span className="text-lg font-bold text-gray-900">Super Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Gestão da Plataforma
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive(item.path) ? "text-indigo-600" : "text-gray-400"
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
            src="https://picsum.photos/40/40"
            alt="Admin"
            className="h-8 w-8 rounded-full"
          />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">Platform Manager</p>
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