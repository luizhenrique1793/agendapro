import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar, Users, DollarSign, TrendingUp, Copy, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { useApp } from "../../store";
import { ManagerSidebar } from "../../components/ManagerSidebar";

const data = [
  { name: "Seg", revenue: 400 },
  { name: "Ter", revenue: 300 },
  { name: "Qua", revenue: 550 },
  { name: "Qui", revenue: 450 },
  { name: "Sex", revenue: 800 },
  { name: "Sab", revenue: 950 },
];

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: any;
  trend: string;
  positive: boolean;
}> = ({ title, value, icon: Icon, trend, positive }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="rounded-full bg-blue-50 p-3 text-primary-600">
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span
        className={`font-medium ${positive ? "text-green-600" : "text-red-600"}`}
      >
        {trend}
      </span>
      <span className="ml-2 text-gray-400">vs mês passado</span>
    </div>
  </div>
);

const BookingLinkCard: React.FC = () => {
  const { currentBusiness } = useApp();
  const [copySuccess, setCopySuccess] = useState(false);

  if (!currentBusiness?.slug) {
    return null; // Or a loading skeleton
  }

  const bookingLink = `${window.location.origin}/#/book/${currentBusiness.slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">Seu Link de Agendamento</h3>
      <p className="mt-1 text-sm text-gray-500">
        Compartilhe este link com seus clientes para que eles possam agendar online.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            readOnly
            value={bookingLink}
            className="block w-full rounded-lg border-gray-300 bg-gray-50 pl-9 text-sm text-gray-900"
          />
        </div>
        <button
          onClick={copyToClipboard}
          className="flex shrink-0 items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-500"
        >
          {copySuccess ? (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copySuccess ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { appointments } = useApp();

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meu Negócio</h1>
          <p className="text-gray-500">
            Visão geral da sua barbearia hoje, {new Date().toLocaleDateString()}.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Agendamentos Hoje"
            value={appointments.length.toString()}
            icon={Calendar}
            trend="+12%"
            positive={true}
          />
          <StatCard
            title="Faturamento (Mês)"
            value="R$ 12.450"
            icon={DollarSign}
            trend="+8.2%"
            positive={true}
          />
          <StatCard
            title="Novos Clientes"
            value="48"
            icon={Users}
            trend="-2%"
            positive={false}
          />
          <StatCard
            title="Ticket Médio"
            value="R$ 85,00"
            icon={TrendingUp}
            trend="+4%"
            positive={true}
          />
        </div>

        <div className="mt-8">
          <BookingLinkCard />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Chart */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-gray-900">
              Receita Semanal
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
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{ borderRadius: "8px", border: "none" }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-gray-900">
              Últimos Agendamentos
            </h3>
            <div className="space-y-4">
              {appointments.slice(0, 5).map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                      {appt.clientName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appt.clientName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appt.date} às {appt.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      appt.status === "Confirmado"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;