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
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  Search,
  Download,
  Filter,
  Calendar as CalendarDaysIcon,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
  AreaChart,
  Area,
} from "recharts";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  isSubscriber: boolean;
  lastAppointment: string;
  totalAppointments: number;
  totalSpent: number;
  subscriptionPlan?: string;
  subscriptionSince?: string;
}

interface MonthlyData {
  month: string;
  subscribers: number;
  walkIns: number;
  total: number;
}

const ClientFrequency = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [lastAppointmentFilter, setLastAppointmentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const mockStats = {
    totalClients: 87,
    subscribers: 34,
    walkIns: 53,
    newThisMonth: 12,
    activeClients: 65,
    inactiveClients: 22,
  };

  const mockMonthlyData: MonthlyData[] = [
    { month: "Mai", subscribers: 28, walkIns: 45, total: 73 },
    { month: "Jun", subscribers: 30, walkIns: 48, total: 78 },
    { month: "Jul", subscribers: 32, walkIns: 50, total: 82 },
    { month: "Ago", subscribers: 33, walkIns: 51, total: 84 },
    { month: "Set", subscribers: 33, walkIns: 52, total: 85 },
    { month: "Out", subscribers: 34, walkIns: 52, total: 86 },
    { month: "Nov", subscribers: 34, walkIns: 53, total: 87 },
  ];

  const mockClients: Client[] = [
    {
      id: "1",
      name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 98765-4321",
      isSubscriber: true,
      lastAppointment: "2025-11-23",
      totalAppointments: 24,
      totalSpent: 1850.00,
      subscriptionPlan: "Premium",
      subscriptionSince: "2025-01-15",
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@email.com",
      phone: "(11) 98765-4322",
      isSubscriber: true,
      lastAppointment: "2025-11-22",
      totalAppointments: 18,
      totalSpent: 1420.00,
      subscriptionPlan: "Basic",
      subscriptionSince: "2025-03-20",
    },
    {
      id: "3",
      name: "Pedro Oliveira",
      email: "pedro@email.com",
      phone: "(11) 98765-4323",
      isSubscriber: false,
      lastAppointment: "2025-11-20",
      totalAppointments: 8,
      totalSpent: 640.00,
    },
    {
      id: "4",
      name: "Ana Costa",
      email: "ana@email.com",
      phone: "(11) 98765-4324",
      isSubscriber: true,
      lastAppointment: "2025-11-19",
      totalAppointments: 20,
      totalSpent: 1600.00,
      subscriptionPlan: "Premium",
      subscriptionSince: "2025-02-10",
    },
    {
      id: "5",
      name: "Carlos Souza",
      email: "carlos@email.com",
      phone: "(11) 98765-4325",
      isSubscriber: false,
      lastAppointment: "2025-11-15",
      totalAppointments: 5,
      totalSpent: 400.00,
    },
    {
      id: "6",
      name: "Juliana Lima",
      email: "juliana@email.com",
      phone: "(11) 98765-4326",
      isSubscriber: true,
      lastAppointment: "2025-11-10",
      totalAppointments: 15,
      totalSpent: 1200.00,
      subscriptionPlan: "Basic",
      subscriptionSince: "2025-04-05",
    },
    {
      id: "7",
      name: "Roberto Alves",
      email: "roberto@email.com",
      phone: "(11) 98765-4327",
      isSubscriber: false,
      lastAppointment: "2025-10-28",
      totalAppointments: 3,
      totalSpent: 240.00,
    },
    {
      id: "8",
      name: "Fernanda Rocha",
      email: "fernanda@email.com",
      phone: "(11) 98765-4328",
      isSubscriber: false,
      lastAppointment: "2025-10-15",
      totalAppointments: 4,
      totalSpent: 320.00,
    },
  ];

  const [clients, setClients] = useState<Client[]>(mockClients);
  const [filteredClients, setFilteredClients] = useState<Client[]>(mockClients);

  useEffect(() => {
    applyFilters();
  }, [clientTypeFilter, lastAppointmentFilter, searchTerm, clients]);

  const applyFilters = () => {
    let filtered = [...clients];

    // Filtro por tipo de cliente
    if (clientTypeFilter === "subscribers") {
      filtered = filtered.filter(c => c.isSubscriber);
    } else if (clientTypeFilter === "walk_ins") {
      filtered = filtered.filter(c => !c.isSubscriber);
    }

    // Filtro por última consulta
    if (lastAppointmentFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter(c => {
        const lastDate = parseISO(c.lastAppointment);
        const daysDiff = differenceInDays(now, lastDate);
        
        switch (lastAppointmentFilter) {
          case "7_days":
            return daysDiff <= 7;
          case "15_days":
            return daysDiff <= 15;
          case "30_days":
            return daysDiff <= 30;
          case "60_days":
            return daysDiff <= 60;
          case "90_days":
            return daysDiff <= 90;
          case "more_90_days":
            return daysDiff > 90;
          default:
            return true;
        }
      });
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      );
    }

    setFilteredClients(filtered);
  };

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: t("search_completed"),
        description: t("client_frequency_updated"),
      });
    }, 1000);
  };

  const handleExport = () => {
    toast({
      title: t("export_completed"),
      description: t("file_downloaded"),
    });
  };

  const getLastAppointmentBadge = (date: string) => {
    const daysDiff = differenceInDays(new Date(), parseISO(date));
    
    if (daysDiff <= 7) {
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">{t("recent")}</Badge>;
    } else if (daysDiff <= 30) {
      return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">{t("active")}</Badge>;
    } else if (daysDiff <= 60) {
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">{t("moderate")}</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">{t("inactive")}</Badge>;
    }
  };

  const clientTypeData = [
    { name: t("subscribers"), value: mockStats.subscribers, color: "#8b5cf6" },
    { name: t("walk_in_clients"), value: mockStats.walkIns, color: "#06b6d4" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("client_frequency")}</h1>
          <p className="text-gray-400 mt-2">
            {t("client_frequency_description")}
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

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("total_clients")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {mockStats.totalClients}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("registered_clients")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              {t("subscribers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">
              {mockStats.subscribers}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {((mockStats.subscribers / mockStats.totalClients) * 100).toFixed(1)}% {t("of_total")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("walk_in_clients")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-500">
              {mockStats.walkIns}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {((mockStats.walkIns / mockStats.totalClients) * 100).toFixed(1)}% {t("of_total")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {t("new_this_month")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {mockStats.newThisMonth}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("november")} 2025
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("active_clients")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              {mockStats.activeClients}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("last_30_days")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("inactive_clients")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {mockStats.inactiveClients}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("more_than_60_days")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("filters")}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t("filter_clients_by_criteria")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-gray-300">
                {t("search")}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t("search_by_name_email_phone")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Tipo de Cliente */}
            <div className="space-y-2">
              <Label htmlFor="client-type" className="text-gray-300">
                {t("client_type")}
              </Label>
              <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
                <SelectTrigger
                  id="client-type"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">{t("all_clients")}</SelectItem>
                  <SelectItem value="subscribers">{t("subscribers_only")}</SelectItem>
                  <SelectItem value="walk_ins">{t("walk_ins_only")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Última Consulta */}
            <div className="space-y-2">
              <Label htmlFor="last-appointment" className="text-gray-300">
                {t("last_appointment")}
              </Label>
              <Select value={lastAppointmentFilter} onValueChange={setLastAppointmentFilter}>
                <SelectTrigger
                  id="last-appointment"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">{t("all_periods")}</SelectItem>
                  <SelectItem value="7_days">{t("last_7_days")}</SelectItem>
                  <SelectItem value="15_days">{t("last_15_days")}</SelectItem>
                  <SelectItem value="30_days">{t("last_30_days")}</SelectItem>
                  <SelectItem value="60_days">{t("last_60_days")}</SelectItem>
                  <SelectItem value="90_days">{t("last_90_days")}</SelectItem>
                  <SelectItem value="more_90_days">{t("more_than_90_days")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão Pesquisar */}
            <div className="space-y-2">
              <Label className="text-gray-300 opacity-0">.</Label>
              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
                onClick={handleSearch}
                disabled={loading}
              >
                <Search className="mr-2 h-4 w-4" />
                {loading ? t("loading") : t("search")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900">
            {t("overview")}
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900">
            {t("subscribers")}
          </TabsTrigger>
          <TabsTrigger value="walk_ins" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900">
            {t("walk_in_clients")}
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900">
            {t("monthly_evolution")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("client_distribution")}</CardTitle>
                <CardDescription className="text-gray-400">
                  {t("subscribers_vs_walk_ins")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={clientTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {clientTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Barras */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("client_activity")}</CardTitle>
                <CardDescription className="text-gray-400">
                  {t("by_last_appointment")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { period: t("0_7_days"), clients: 15 },
                      { period: t("8_30_days"), clients: 28 },
                      { period: t("31_60_days"), clients: 22 },
                      { period: t("60_plus_days"), clients: 22 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="period" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="clients" fill="#06b6d4" radius={[8, 8, 0, 0]} name={t("clients")} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Clientes */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                {t("all_clients")} ({filteredClients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={client.avatar} />
                          <AvatarFallback className="bg-yellow-500 text-gray-900 font-bold">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <h3 className="text-white font-semibold">{client.name}</h3>
                            <p className="text-sm text-gray-400">{client.email}</p>
                            <p className="text-sm text-gray-400">{client.phone}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("type")}</p>
                            {client.isSubscriber ? (
                              <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                                <UserCheck className="h-3 w-3 mr-1" />
                                {t("subscriber")}
                              </Badge>
                            ) : (
                              <Badge className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30">
                                <Users className="h-3 w-3 mr-1" />
                                {t("walk_in")}
                              </Badge>
                            )}
                            {client.subscriptionPlan && (
                              <p className="text-xs text-gray-400 mt-1">{client.subscriptionPlan}</p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("last_appointment")}</p>
                            <p className="text-sm text-white">
                              {format(parseISO(client.lastAppointment), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {differenceInDays(new Date(), parseISO(client.lastAppointment))} {t("days_ago")}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("appointments")}</p>
                            <p className="text-lg font-bold text-white">{client.totalAppointments}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("total_spent")}</p>
                            <p className="text-lg font-bold text-green-500">
                              R$ {client.totalSpent.toFixed(2).replace('.', ',')}
                            </p>
                            {getLastAppointmentBadge(client.lastAppointment)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-500" />
                {t("subscriber_clients")} ({filteredClients.filter(c => c.isSubscriber).length})
              </CardTitle>
              <CardDescription className="text-gray-400">
                {t("clients_with_active_subscription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredClients.filter(c => c.isSubscriber).map((client) => (
                  <Card key={client.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={client.avatar} />
                          <AvatarFallback className="bg-purple-500 text-white font-bold">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <h3 className="text-white font-semibold">{client.name}</h3>
                            <p className="text-sm text-gray-400">{client.email}</p>
                            <p className="text-sm text-gray-400">{client.phone}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("plan")}</p>
                            <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                              {client.subscriptionPlan}
                            </Badge>
                            {client.subscriptionSince && (
                              <p className="text-xs text-gray-400 mt-1">
                                {t("since")} {format(parseISO(client.subscriptionSince), "MMM yyyy", { locale: ptBR })}
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("last_appointment")}</p>
                            <p className="text-sm text-white">
                              {format(parseISO(client.lastAppointment), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {differenceInDays(new Date(), parseISO(client.lastAppointment))} {t("days_ago")}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("appointments")}</p>
                            <p className="text-lg font-bold text-white">{client.totalAppointments}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("total_spent")}</p>
                            <p className="text-lg font-bold text-green-500">
                              R$ {client.totalSpent.toFixed(2).replace('.', ',')}
                            </p>
                            {getLastAppointmentBadge(client.lastAppointment)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Walk-Ins Tab */}
        <TabsContent value="walk_ins" className="space-y-6">
          <div className="flex justify-end mb-4">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
              onClick={() => navigate('/dashboard/walk-in-report')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {t("view_walk_in_report")}
            </Button>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-500" />
                {t("walk_in_clients")} ({filteredClients.filter(c => !c.isSubscriber).length})
              </CardTitle>
              <CardDescription className="text-gray-400">
                {t("clients_without_subscription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredClients.filter(c => !c.isSubscriber).map((client) => (
                  <Card key={client.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={client.avatar} />
                          <AvatarFallback className="bg-cyan-500 text-white font-bold">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <h3 className="text-white font-semibold">{client.name}</h3>
                            <p className="text-sm text-gray-400">{client.email}</p>
                            <p className="text-sm text-gray-400">{client.phone}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("last_appointment")}</p>
                            <p className="text-sm text-white">
                              {format(parseISO(client.lastAppointment), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {differenceInDays(new Date(), parseISO(client.lastAppointment))} {t("days_ago")}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("appointments")}</p>
                            <p className="text-lg font-bold text-white">{client.totalAppointments}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">{t("total_spent")}</p>
                            <p className="text-lg font-bold text-green-500">
                              R$ {client.totalSpent.toFixed(2).replace('.', ',')}
                            </p>
                            {getLastAppointmentBadge(client.lastAppointment)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Evolution Tab */}
        <TabsContent value="monthly" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{t("monthly_evolution")}</CardTitle>
              <CardDescription className="text-gray-400">
                {t("client_growth_over_time")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={mockMonthlyData}>
                  <defs>
                    <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWalkIns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="subscribers"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorSubscribers)"
                    name={t("subscribers")}
                  />
                  <Area
                    type="monotone"
                    dataKey="walkIns"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorWalkIns)"
                    name={t("walk_in_clients")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabela Mensal */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{t("monthly_breakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">
                        {t("month")}
                      </th>
                      <th className="text-right py-3 px-4 text-gray-300 font-semibold">
                        {t("subscribers")}
                      </th>
                      <th className="text-right py-3 px-4 text-gray-300 font-semibold">
                        {t("walk_in_clients")}
                      </th>
                      <th className="text-right py-3 px-4 text-gray-300 font-semibold">
                        {t("total")}
                      </th>
                      <th className="text-right py-3 px-4 text-gray-300 font-semibold">
                        {t("growth")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMonthlyData.map((data, index) => {
                      const previousTotal = index > 0 ? mockMonthlyData[index - 1].total : data.total;
                      const growth = index > 0 ? data.total - previousTotal : 0;
                      const growthPercent = index > 0 ? ((growth / previousTotal) * 100).toFixed(1) : 0;
                      
                      return (
                        <tr
                          key={data.month}
                          className="border-b border-gray-700 hover:bg-gray-700/30"
                        >
                          <td className="py-3 px-4 text-white font-medium">{data.month}</td>
                          <td className="py-3 px-4 text-right text-purple-500 font-semibold">
                            {data.subscribers}
                          </td>
                          <td className="py-3 px-4 text-right text-cyan-500 font-semibold">
                            {data.walkIns}
                          </td>
                          <td className="py-3 px-4 text-right text-white font-bold">
                            {data.total}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {index > 0 && (
                              <span className={growth >= 0 ? "text-green-500" : "text-red-500"}>
                                {growth >= 0 ? "+" : ""}{growth} ({growthPercent}%)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientFrequency;
