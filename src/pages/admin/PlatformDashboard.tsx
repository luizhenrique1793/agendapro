import React from "react";
import { AdminSidebar } from "../../components/AdminSidebar";
import { useApp } from "../../store";
import { Users, Store, TrendingUp, DollarSign, CheckCircle, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", active: 20 },
  { name: "Fev", active: 25 },
  { name: "Mar", active: 32 },
  { name: "Abr", active: 40 },
  { name: "Mai", active: 45 },
  { name: "Jun", active: 58 },
];

const PLAN_PRICES: { [key: string]: number } = {
  'Básico': 49,
  'Profissional': 89,
  'Empresarial': 149,
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: any;
  trend?: string;
  positive?: boolean;
  iconBgColor?: string;
}> = ({ title, value, icon: Icon, trend, positive, iconBgColor = "bg-indigo-50 text-indigo-600" }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`rounded-full p-3 ${iconBgColor}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span
          className={`font-medium ${positive ? "text-green-600" : "text-red-600"}`}
        >
          {trend}
        </span>
        <span className="ml-2 text-gray-400">vs mês passado</span>
      </div>
    )}
  </div>
);

const PlatformDashboard: React.FC = () => {
  const { businesses, users } = useApp();

  const mrr = businesses.reduce((total, business) => {
    if (business.subscription_status === 'active' && business.plan && PLAN_PRICES[business.plan]) {
      return total + PLAN_PRICES[business.plan];
    }
    return total;
  }, 0);

  const activeSubscriptions = businesses.filter(b => b.subscription_status === 'active').length;
  const trialingSubscriptions = businesses.filter(b => b.subscription_status === 'trialing').length;

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral da Plataforma</h1>
          <p className="text-gray-500">
            Acompanhe o crescimento e a saúde do SaaS AgendaPro.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="MRR (Receita Mensal)"
            value={`R$ ${mrr.toFixed(2).replace('.', ',')}`}
            icon={DollarSign}
            trend="+8.2%"
            positive={true}
            iconBgColor="bg-green-50 text-green-600"
          />
          <StatCard
            title="Assinaturas Ativas"
            value={activeSubscriptions.toString()}
            icon={CheckCircle}
            trend="+5 novas"
            positive={true}
            iconBgColor="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Negócios em Teste"
            value={trialingSubscriptions.toString()}
            icon={Clock}
            trend="+10%"
            positive={true}
            iconBgColor="bg-yellow-50 text-yellow-600"
          />
          <StatCard
            title="Total de Usuários"
            value={users.length.toString()}
            icon={Users}
            trend="+12%"
            positive={true}
            iconBgColor="bg-purple-50 text-purple-600"
          />
        </div>

        <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-gray-900">
            Crescimento de Negócios Ativos
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280" }}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{ borderRadius: "8px", border: "none" }}
                />
                <Bar
                  dataKey="active"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlatformDashboard;