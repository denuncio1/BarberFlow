import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { supabase } from "../integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { exportToCSV } from "@/lib/exportUtils";
import { exportToPDF } from "@/lib/pdfUtils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export const DashboardCharts: React.FC = () => {
  const [period, setPeriod] = useState<'month' | 'week' | 'year'>('month');
  const [barberShop, setBarberShop] = useState<string>("");
  const [barberShops, setBarberShops] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [vipClientsData, setVipClientsData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any>(null);
  const [recurrenceData, setRecurrenceData] = useState<any>(null);
  const [inactiveClientsData, setInactiveClientsData] = useState<any>(null);
  const [recurringClientsData, setRecurringClientsData] = useState<any>(null);
  const [averageTicketData, setAverageTicketData] = useState<any>(null);
  const [vipRanking, setVipRanking] = useState<any[]>([]);
  const [inactiveRanking, setInactiveRanking] = useState<any[]>([]);
  const [birthdayRanking, setBirthdayRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchBarberShops() {
      const { data } = await supabase.from("barber_shops").select("id, name");
      setBarberShops(data || []);
      if (data && data.length > 0 && !barberShop) setBarberShop(data[0].id);
    }
    fetchBarberShops();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        // Adicionar filtro de barbearia
        const filter = barberShop ? { eq: ["barber_shop_id", barberShop] } : {};
        // Faturamento mensal
        let startDate, endDate;
        const now = new Date();
        if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === 'week') {
          const day = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - day);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
        } else {
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
        }
        const { data: appointments } = await supabase
          .from("appointments")
          .select("appointment_date, price, barber_shop_id")
          .gte("appointment_date", startDate.toISOString().slice(0, 10))
          .lte("appointment_date", endDate.toISOString().slice(0, 10))
          .eq("barber_shop_id", barberShop);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const revenueByMonth = Array(12).fill(0);
        (appointments || []).forEach((a: any) => {
          const month = new Date(a.appointment_date).getMonth();
          revenueByMonth[month] += a.price || 0;
        });
        setRevenueData({
          labels: months,
          datasets: [{ label: "Faturamento (R$)", data: revenueByMonth, backgroundColor: "#6366f1" }],
        });

        // Clientes VIP
        const { data: clients } = await supabase
          .from("clients")
          .select("id, is_vip, barber_shop_id")
          .eq("barber_shop_id", barberShop);
        const vip = (clients || []).filter((c: any) => c.is_vip).length;
        const regulares = (clients || []).filter((c: any) => !c.is_vip).length;
        setVipClientsData({
          labels: ["VIP", "Regulares"],
          datasets: [{ label: "Clientes", data: [vip, regulares], backgroundColor: ["#22d3ee", "#a78bfa"] }],
        });

        // Produtos mais vendidos
        const { data: products } = await supabase
          .from("products")
          .select("name, sold_count, barber_shop_id")
          .eq("barber_shop_id", barberShop);
        setProductsData({
          labels: (products || []).map((p: any) => p.name),
          datasets: [{ label: "Vendidos", data: (products || []).map((p: any) => p.sold_count || 0), backgroundColor: "#f59e42" }],
        });

        // Recorrência de clientes
        const { data: recurrences } = await supabase
          .from("appointments")
          .select("client_id, appointment_date, barber_shop_id")
          .eq("barber_shop_id", barberShop);
        const weeks = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
        const weekCounts = Array(4).fill(0);
        (recurrences || []).forEach((a: any) => {
          const week = Math.floor((new Date(a.appointment_date).getDate() - 1) / 7);
          weekCounts[week] += 1;
        });
        setRecurrenceData({
          labels: weeks,
          datasets: [{ label: "Recorrência", data: weekCounts, borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.2)" }],
        });

        // Clientes inativos (sem agendamento nos últimos 60 dias)
        const { data: allClients } = await supabase
          .from("clients")
          .select("id, name, barber_shop_id")
          .eq("barber_shop_id", barberShop);
        const { data: allAppointments } = await supabase
          .from("appointments")
          .select("client_id, appointment_date, barber_shop_id")
          .eq("barber_shop_id", barberShop);
        const inactiveClients = (allClients || []).filter((client: any) => {
          const lastAppt = (allAppointments || [])
            .filter((a: any) => a.client_id === client.id)
            .sort((a: any, b: any) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0];
          if (!lastAppt) return true;
          const lastDate = new Date(lastAppt.appointment_date);
          return (new Date().getTime() - lastDate.getTime()) > 60 * 24 * 60 * 60 * 1000;
        });
        setInactiveClientsData({
          labels: inactiveClients.map((c: any) => c.name),
          datasets: [{ label: "Inativos", data: inactiveClients.map(() => 1), backgroundColor: "#f87171" }],
        });

        // Clientes recorrentes (2+ agendamentos no período)
        const recurringClients = (allClients || []).filter((client: any) => {
          const appts = (allAppointments || []).filter((a: any) => a.client_id === client.id);
          return appts.length >= 2;
        });
        setRecurringClientsData({
          labels: recurringClients.map((c: any) => c.name),
          datasets: [{ label: "Recorrentes", data: recurringClients.map(() => 1), backgroundColor: "#34d399" }],
        });

        // Ticket médio
        const tickets = (allAppointments || []).map((a: any) => a.price || 0);
        const avgTicket = tickets.length > 0 ? (tickets.reduce((a, b) => a + b, 0) / tickets.length) : 0;
        setAverageTicketData({
          labels: ["Ticket Médio"],
          datasets: [{ label: "R$", data: [avgTicket], backgroundColor: "#6366f1" }],
        });

        // Ranking VIP
        const vipClientsSorted = (clients || [])
          .filter((c: any) => c.is_vip)
          .sort((a: any, b: any) => b.total_spent - a.total_spent)
          .slice(0, 5);
        setVipRanking(vipClientsSorted);

        // Ranking Inativos
        setInactiveRanking(inactiveClients.slice(0, 5));

        // Ranking Aniversariantes
        const currentMonth = new Date().getMonth() + 1;
        const birthdayClients = (clients || [])
          .filter((c: any) => {
            if (!c.birthday) return false;
            const month = new Date(c.birthday).getMonth() + 1;
            return month === currentMonth;
          })
          .sort((a: any, b: any) => new Date(a.birthday).getDate() - new Date(b.birthday).getDate())
          .slice(0, 5);
        setBirthdayRanking(birthdayClients);
      } catch (err: any) {
        setError("Erro ao carregar dados do dashboard.");
      }
      setLoading(false);
    }
    if (barberShop) fetchData();
  }, [period, barberShop]);

  return (
    <div>
      <div className="flex justify-between mb-4 gap-4">
        <Select value={barberShop} onValueChange={v => setBarberShop(v)}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione a barbearia" />
          </SelectTrigger>
          <SelectContent>
            {barberShops.map(bs => (
              <SelectItem key={bs.id} value={bs.id}>{bs.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={v => setPeriod(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Faturamento Mensal</CardTitle>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 bg-blue-100 text-blue-900 font-semibold rounded hover:bg-blue-200" onClick={() => exportToCSV("faturamento.csv", revenueData?.datasets[0]?.data?.map((v: any, i: number) => ({ mês: revenueData.labels[i], valor: v })) || [])}>Exportar CSV</button>
              <button className="text-xs px-2 py-1 bg-purple-100 text-purple-900 font-semibold rounded hover:bg-purple-200" onClick={() => exportToPDF("faturamento.pdf", "Faturamento Mensal", revenueData?.datasets[0]?.data?.map((v: any, i: number) => ({ mês: revenueData.labels[i], valor: v })) || [])}>Exportar PDF</button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-xs text-gray-400">Carregando...</div>
            ) : error ? (
              <div className="text-center text-xs text-red-400">{error}</div>
            ) : revenueData ? (
              <Bar data={revenueData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="text-center text-xs text-gray-400">Sem dados</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Clientes VIP</CardTitle>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 bg-blue-100 text-blue-900 font-bold shadow-sm rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => exportToCSV("clientes_vip.csv", vipClientsData?.datasets[0]?.data?.map((v: any, i: number) => ({ tipo: vipClientsData.labels[i], quantidade: v })) || [])}>Exportar CSV</button>
              <button className="text-xs px-2 py-1 bg-purple-100 text-purple-900 font-bold shadow-sm rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => exportToPDF("clientes_vip.pdf", "Clientes VIP", vipClientsData?.datasets[0]?.data?.map((v: any, i: number) => ({ tipo: vipClientsData.labels[i], quantidade: v })) || [])}>Exportar PDF</button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-xs text-gray-400">Carregando...</div>
            ) : error ? (
              <div className="text-center text-xs text-red-400">{error}</div>
            ) : vipClientsData ? (
              <Pie data={vipClientsData} options={{ responsive: true }} />
            ) : (
              <div className="text-center text-xs text-gray-400">Sem dados</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 bg-blue-100 text-blue-900 font-bold shadow-sm rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => exportToCSV("produtos_vendidos.csv", productsData?.datasets[0]?.data?.map((v: any, i: number) => ({ produto: productsData.labels[i], vendidos: v })) || [])}>Exportar CSV</button>
              <button className="text-xs px-2 py-1 bg-purple-100 text-purple-900 font-bold shadow-sm rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => exportToPDF("produtos_vendidos.pdf", "Produtos Mais Vendidos", productsData?.datasets[0]?.data?.map((v: any, i: number) => ({ produto: productsData.labels[i], vendidos: v })) || [])}>Exportar PDF</button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-xs text-gray-400">Carregando...</div>
            ) : error ? (
              <div className="text-center text-xs text-red-400">{error}</div>
            ) : productsData ? (
              <Bar data={productsData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="text-center text-xs text-gray-400">Sem dados</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Recorrência de Clientes</CardTitle>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 bg-blue-100 text-blue-900 font-bold shadow-sm rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => exportToCSV("recorrencia_clientes.csv", recurrenceData?.datasets[0]?.data?.map((v: any, i: number) => ({ semana: recurrenceData.labels[i], recorrencia: v })) || [])}>Exportar CSV</button>
              <button className="text-xs px-2 py-1 bg-purple-100 text-purple-900 font-bold shadow-sm rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => exportToPDF("recorrencia_clientes.pdf", "Recorrência de Clientes", recurrenceData?.datasets[0]?.data?.map((v: any, i: number) => ({ semana: recurrenceData.labels[i], recorrencia: v })) || [])}>Exportar PDF</button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-xs text-gray-400">Carregando...</div>
            ) : error ? (
              <div className="text-center text-xs text-red-400">{error}</div>
            ) : recurrenceData ? (
              <Line data={recurrenceData} options={{ responsive: true }} />
            ) : (
              <div className="text-center text-xs text-gray-400">Sem dados</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Clientes Inativos</CardTitle>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 bg-blue-100 text-blue-900 font-bold shadow-sm rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => exportToCSV("clientes_inativos.csv", inactiveClientsData?.datasets[0]?.data?.map((v: any, i: number) => ({ cliente: inactiveClientsData.labels[i], status: v })) || [])}>Exportar CSV</button>
              <button className="text-xs px-2 py-1 bg-purple-100 text-purple-900 font-bold shadow-sm rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => exportToPDF("clientes_inativos.pdf", "Clientes Inativos", inactiveClientsData?.datasets[0]?.data?.map((v: any, i: number) => ({ cliente: inactiveClientsData.labels[i], status: v })) || [])}>Exportar PDF</button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-xs text-gray-400">Carregando...</div>
            ) : error ? (
              <div className="text-center text-xs text-red-400">{error}</div>
            ) : inactiveClientsData ? (
              <Bar data={inactiveClientsData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="text-center text-xs text-gray-400">Sem dados</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Clientes Recorrentes</CardTitle>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 bg-blue-100 text-blue-900 font-bold shadow-sm rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => exportToCSV("clientes_recorrentes.csv", recurringClientsData?.datasets[0]?.data?.map((v: any, i: number) => ({ cliente: recurringClientsData.labels[i], status: v })) || [])}>Exportar CSV</button>
              <button className="text-xs px-2 py-1 bg-purple-100 text-purple-900 font-bold shadow-sm rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => exportToPDF("clientes_recorrentes.pdf", "Clientes Recorrentes", recurringClientsData?.datasets[0]?.data?.map((v: any, i: number) => ({ cliente: recurringClientsData.labels[i], status: v })) || [])}>Exportar PDF</button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-xs text-gray-400">Carregando...</div>
            ) : error ? (
              <div className="text-center text-xs text-red-400">{error}</div>
            ) : recurringClientsData ? (
              <Bar data={recurringClientsData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="text-center text-xs text-gray-400">Sem dados</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Ticket Médio</CardTitle>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 bg-blue-100 text-blue-900 font-bold shadow-sm rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => exportToCSV("ticket_medio.csv", averageTicketData?.datasets[0]?.data?.map((v: any, i: number) => ({ descricao: averageTicketData.labels[i], valor: v })) || [])}>Exportar CSV</button>
              <button className="text-xs px-2 py-1 bg-purple-100 text-purple-900 font-bold shadow-sm rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={() => exportToPDF("ticket_medio.pdf", "Ticket Médio", averageTicketData?.datasets[0]?.data?.map((v: any, i: number) => ({ descricao: averageTicketData.labels[i], valor: v })) || [])}>Exportar PDF</button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-xs text-gray-400">Carregando...</div>
            ) : error ? (
              <div className="text-center text-xs text-red-400">{error}</div>
            ) : averageTicketData ? (
              <Bar data={averageTicketData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="text-center text-xs text-gray-400">Sem dados</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ranking VIP</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {vipRanking.length === 0 && <li className="text-xs text-gray-400">Nenhum cliente VIP.</li>}
              {vipRanking.map((c: any, idx: number) => (
                <li key={c.id} className="flex items-center justify-between text-sm p-2 rounded bg-blue-50 dark:bg-blue-900">
                  <span className="font-semibold">{idx + 1}. {c.name}</span>
                  <span className="text-blue-700 dark:text-blue-300">R$ {c.total_spent?.toFixed(2) ?? '--'}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ranking Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {inactiveRanking.length === 0 && <li className="text-xs text-gray-400">Nenhum cliente inativo.</li>}
              {inactiveRanking.map((c: any, idx: number) => (
                <li key={c.id} className="flex items-center justify-between text-sm p-2 rounded bg-red-50 dark:bg-red-900">
                  <span className="font-semibold">{idx + 1}. {c.name}</span>
                  <span className="text-red-700 dark:text-red-300">Inativo</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aniversariantes do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {birthdayRanking.length === 0 && <li className="text-xs text-gray-400">Nenhum aniversariante este mês.</li>}
              {birthdayRanking.map((c: any, idx: number) => (
                <li key={c.id} className="flex items-center justify-between text-sm p-2 rounded bg-pink-50 dark:bg-pink-900">
                  <span className="font-semibold">{idx + 1}. {c.name}</span>
                  <span className="text-pink-700 dark:text-pink-300">{new Date(c.birthday).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
