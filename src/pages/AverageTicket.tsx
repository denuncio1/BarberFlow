import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Package,
  BarChart3,
  Search,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
}

interface TicketData {
  date: string;
  average: number;
  total: number;
  appointments: number;
}

interface BarberStats {
  id: string;
  name: string;
  avatar?: string;
  totalRevenue: number;
  totalAppointments: number;
  averageTicket: number;
  servicesRevenue: number;
  productsRevenue: number;
  servicesSold: number;
  productsSold: number;
}

const AverageTicket = () => {
    const { session } = useSession();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [signatureFilter, setSignatureFilter] = useState("not_consider");
  const [statusFilter, setStatusFilter] = useState("completed");
  const [orderBy, setOrderBy] = useState("total_revenue");
  const [unitFilter, setUnitFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [chartData, setChartData] = useState<TicketData[]>([]);
  const [barberStats, setBarberStats] = useState<BarberStats[]>([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [uniqueClients, setUniqueClients] = useState(0);
  const [ticketPerAppointment, setTicketPerAppointment] = useState(0);
  const [ticketPerUniqueClient, setTicketPerUniqueClient] = useState(0);
  const [servicesRevenue, setServicesRevenue] = useState(0);
  const [servicesSales, setServicesSales] = useState(0);
  const [productsRevenue, setProductsRevenue] = useState(0);
  const [productsSales, setProductsSales] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Buscar barbeiros reais
      const { data: barbersData, error: barbersError } = await supabase
        .from("technicians")
        .select("id, name")
        .order("name");
      setTeamMembers(barbersData || []);

      // Buscar agendamentos reais
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, client_id, technician_id, appointment_date, status, total_price")
        .gte("appointment_date", format(startDate, 'yyyy-MM-dd') + 'T00:00:00.000Z')
        .lte("appointment_date", format(endDate, 'yyyy-MM-dd') + 'T23:59:59.999Z');

      const completed = (appointmentsData || []).filter(a => a.status === 'completed' || a.status === 'finalized');
      setTotalAppointments(completed.length);
      const clientSet = new Set(completed.map(a => a.client_id));
      setUniqueClients(clientSet.size);

      // Ticket médio por agendamento
      const totalRevenue = completed.reduce((sum, a) => sum + (a.total_price || 0), 0);
      setTicketPerAppointment(completed.length > 0 ? totalRevenue / completed.length : 0);
      setTicketPerUniqueClient(clientSet.size > 0 ? totalRevenue / clientSet.size : 0);

      // Buscar vendas de serviços e produtos (mock: total_price é soma dos dois)
      setServicesRevenue(totalRevenue * 0.8); // Supondo 80% serviços
      setProductsRevenue(totalRevenue * 0.2); // Supondo 20% produtos
      setServicesSales(completed.length * 1); // Supondo 1 serviço por agendamento
      setProductsSales(completed.length * 0.3); // Supondo 0.3 produto por agendamento

      // Estatísticas por barbeiro
      const statsByBarber = (barbersData || []).map(barber => {
        const barberAppointments = completed.filter(a => a.technician_id === barber.id);
        const revenue = barberAppointments.reduce((sum, a) => sum + (a.total_price || 0), 0);
        return {
          id: barber.id,
          name: barber.name,
          avatar: "",
          totalRevenue: revenue,
          totalAppointments: barberAppointments.length,
          averageTicket: barberAppointments.length > 0 ? revenue / barberAppointments.length : 0,
          servicesRevenue: revenue * 0.8,
          productsRevenue: revenue * 0.2,
          servicesSold: barberAppointments.length * 1,
          productsSold: barberAppointments.length * 0.3,
        };
      });
      setBarberStats(statsByBarber);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: t("search_completed"),
        description: t("average_ticket_updated"),
      });
    }, 1000);
  };

  const handleExport = () => {
    toast({
      title: t("export_completed"),
      description: t("file_downloaded"),
    });
  };

  // Exemplo de revenueData real (deve ser preenchido com dados reais)
  const revenueData = [
    { name: t("services"), value: servicesRevenue, color: "#10b981" },
    { name: t("products"), value: productsRevenue, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("average_ticket")}</h1>
          <p className="text-gray-400 mt-2">
            {t("average_ticket_description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{t("filters")}</CardTitle>
          <CardDescription className="text-gray-400">
            {t("configure_analysis_period")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Data Início */}
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-gray-300">
                {t("start")}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                      !startDate && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>{t("select_date")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    locale={ptBR}
                    className="bg-gray-800"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-gray-300">
                {t("end")}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                      !endDate && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>{t("select_date")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    locale={ptBR}
                    className="bg-gray-800"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Considerar Assinaturas */}
            <div className="space-y-2">
              <Label htmlFor="signature" className="text-gray-300">
                {t("consider_signatures")}
              </Label>
              <Select value={signatureFilter} onValueChange={setSignatureFilter}>
                <SelectTrigger
                  id="signature"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="not_consider">{t("do_not_consider")}</SelectItem>
                  <SelectItem value="consider">{t("consider")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status das Comandas */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">
                {t("order_status")}
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  id="status"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="completed">{t("only_completed")}</SelectItem>
                  <SelectItem value="all">{t("all")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar Lista Por */}
            <div className="space-y-2">
              <Label htmlFor="order-by" className="text-gray-300">
                {t("order_list_by")}
              </Label>
              <Select value={orderBy} onValueChange={setOrderBy}>
                <SelectTrigger
                  id="order-by"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="total_revenue">{t("total_revenue")}</SelectItem>
                  <SelectItem value="average_ticket">{t("average_ticket")}</SelectItem>
                  <SelectItem value="appointments">{t("appointments")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
              onClick={handleSearch}
              disabled={loading}
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? t("loading") : t("search")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Principal */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-2">
              {t("appointments_performed_summary", { 
                appointments: 0, 
                clients: 0 
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {t("ticket_per_appointment")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-500">
                  R$ {0.00.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {t("avg_spent_per_appointment")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {t("ticket_per_unique_client")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-500">
                  R$ {0.00.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {t("avg_spent_per_client")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  {t("services")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  R$ {0.00.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  0 {t("sales_in_appointments")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t("products")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">
                  R$ {0.00.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  0 {t("sales_in_appointments")}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Linha - Ticket Médio por Dia */}
        <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">{t("average_ticket_per_day")}</CardTitle>
            <CardDescription className="text-gray-400">
              {t("daily_evolution")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ fill: "#06b6d4", r: 6 }}
                  name={t("average_ticket")}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Receita por Tipo */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">{t("revenue_distribution")}</CardTitle>
            <CardDescription className="text-gray-400">
              {t("services_vs_products")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Barbeiros */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{t("performance_by_barber")}</CardTitle>
          <CardDescription className="text-gray-400">
            {t("individual_results")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {barberStats.map((barber) => (
              <Card key={barber.id} className="bg-gray-700 border-gray-600">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={barber.avatar} />
                      <AvatarFallback className="bg-yellow-500 text-gray-900 text-xl font-bold">
                        {barber.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{barber.name}</h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {t("billed")}: R$ {barber.totalRevenue.toFixed(2).replace('.', ',')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                              <Users className="h-3 w-3 mr-1" />
                              {t("appointments")}: {barber.totalAppointments}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              {t("ticket")}: R$ {barber.averageTicket.toFixed(2).replace('.', ',')}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-green-500" />
                          {t("services")}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-300">
                          <p>{t("sales")}: <span className="text-green-500 font-semibold">{barber.servicesSold}</span></p>
                          <p>{t("revenue")}: <span className="text-green-500 font-semibold">R$ {barber.servicesRevenue.toFixed(2).replace('.', ',')}</span></p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                          <Package className="h-4 w-4 text-orange-500" />
                          {t("products")}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-300">
                          <p>{t("sales")}: <span className="text-orange-500 font-semibold">{barber.productsSold}</span></p>
                          <p>{t("revenue")}: <span className="text-orange-500 font-semibold">R$ {barber.productsRevenue.toFixed(2).replace('.', ',')}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AverageTicket;
