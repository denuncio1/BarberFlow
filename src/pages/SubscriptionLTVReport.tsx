import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BadgeCheck, User, CalendarDays, TrendingUp, Download } from "lucide-react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { exportToCSV } from "@/lib/exportUtils";
import { exportToPDF } from "@/lib/pdfUtils";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const mockData = [
  {
    id: "1247526",
    name: "Ackel Kempps",
    phone: "(91) 99907-8042",
    memberSince: "29/09/2025",
    retention: "2 meses",
    monthly: 169.9,
    ltv: 339.8,
    status: "VIP",
    plan: "Gold",
  },
  // ...mais clientes
];

const ltvByPlanData = {
  labels: ["Gold", "Silver", "Bronze"],
  datasets: [
    {
      label: "LTV Médio por Plano",
      data: [1200, 800, 400],
      backgroundColor: ["#facc15", "#a3a3a3", "#f59e42"],
    },
  ],
};
const ltvByClientData = {
  labels: mockData.map((c) => c.name),
  datasets: [
    {
      label: "LTV por Cliente",
      data: mockData.map((c) => c.ltv),
      backgroundColor: "#6366f1",
    },
  ],
};

export default function SubscriptionLTVReport() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-green-900 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Relatório de LTV das Assinaturas</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform">
          <Download className="h-5 w-5" /> Exportar LTV
        </button>
      </div>
      <div className="bg-black/40 rounded-2xl shadow-2xl p-6">
        <div className="flex gap-8 mb-6">
          <button className="text-lg font-bold text-blue-300 border-b-4 border-blue-400 pb-2">LTV por Cliente</button>
          <button className="text-lg font-bold text-purple-300 border-b-4 border-transparent pb-2 hover:border-purple-400 transition">LTV por Plano</button>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <input className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar por nome, telefone ou email..." />
          <button className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-400 text-white font-bold rounded-lg shadow hover:scale-105 transition-transform">Filtrar</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-white">
            <thead>
              <tr className="bg-gradient-to-r from-blue-900 via-purple-900 to-green-900">
                <th className="p-3 text-left">ID CLIENTE</th>
                <th className="p-3 text-left">NOME</th>
                <th className="p-3 text-left">MEMBRO DESDE</th>
                <th className="p-3 text-left">RETENÇÃO</th>
                <th className="p-3 text-left">MÉDIA MENSAL</th>
                <th className="p-3 text-left">LTV TOTAL</th>
                <th className="p-3 text-left">STATUS</th>
                <th className="p-3 text-left">PLANO</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((c, idx) => (
                <tr key={c.id} className="bg-gradient-to-r from-blue-950 via-purple-950 to-green-950 hover:bg-blue-900/60 transition">
                  <td className="p-3 font-mono text-blue-300">{c.id}</td>
                  <td className="p-3 flex flex-col gap-1">
                    <span className="font-bold text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-400" /> {c.name}
                    </span>
                    <span className="text-green-300 font-mono">{c.phone}</span>
                  </td>
                  <td className="p-3"><CalendarDays className="inline-block h-4 w-4 text-purple-400 mr-1" /> {c.memberSince}</td>
                  <td className="p-3"><TrendingUp className="inline-block h-4 w-4 text-green-400 mr-1" /> {c.retention}</td>
                  <td className="p-3 font-bold text-blue-200">R$ {c.monthly.toFixed(2)}</td>
                  <td className="p-3 font-bold text-green-400">R$ {c.ltv.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full font-bold text-xs ${c.status === 'VIP' ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-white'}`}>{c.status}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full font-bold text-xs ${c.plan === 'Gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' : 'bg-gray-700 text-white'}`}>{c.plan}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="bg-gradient-to-br from-blue-900 via-purple-900 to-green-900">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-white">LTV Médio por Plano</CardTitle>
              <div className="flex gap-2">
                <button className="text-xs px-2 py-1 bg-blue-100 text-blue-900 font-bold shadow-sm rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => exportToCSV("ltv_planos.csv", ltvByPlanData.labels.map((label: string, i: number) => ({ plano: label, ltv: ltvByPlanData.datasets[0].data[i] })))}>Exportar CSV</button>
                <button className="text-xs px-2 py-1 bg-purple-100 text-purple-900 font-bold shadow-sm rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => exportToPDF("ltv_planos.pdf", "LTV Médio por Plano", ltvByPlanData.labels.map((label: string, i: number) => ({ plano: label, ltv: ltvByPlanData.datasets[0].data[i] })))}>Exportar PDF</button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-xs text-gray-400">Carregando...</div>
              ) : error ? (
                <div className="text-center text-xs text-red-400">{error}</div>
              ) : (
                <Bar data={ltvByPlanData} options={{ responsive: true, plugins: { legend: { labels: { color: '#fff' } } } }} />
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900 via-purple-900 to-green-900">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-white">LTV por Cliente</CardTitle>
              <div className="flex gap-2">
                <button className="text-xs px-2 py-1 bg-blue-100 text-blue-900 font-bold shadow-sm rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => exportToCSV("ltv_clientes.csv", ltvByClientData.labels.map((label: string, i: number) => ({ cliente: label, ltv: ltvByClientData.datasets[0].data[i] })))}>Exportar CSV</button>
                <button className="text-xs px-2 py-1 bg-purple-100 text-purple-900 font-bold shadow-sm rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => exportToPDF("ltv_clientes.pdf", "LTV por Cliente", ltvByClientData.labels.map((label: string, i: number) => ({ cliente: label, ltv: ltvByClientData.datasets[0].data[i] })))}>Exportar PDF</button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-xs text-gray-400">Carregando...</div>
              ) : error ? (
                <div className="text-center text-xs text-red-400">{error}</div>
              ) : (
                <Pie data={ltvByClientData} options={{ responsive: true, plugins: { legend: { labels: { color: '#fff' } } } }} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
