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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Clock,
  Users,
  TrendingUp,
  Calendar as CalendarDaysIcon,
  Activity,
  Target,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/contexts/SessionContext";
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
  Area,
  AreaChart,
} from "recharts";

interface TeamMember {
  id: string;
  name: string;
}

interface OccupancyData {
  date: string;
  rate: number;
  appointments: number;
  maxCapacity: number;
}

const OccupancyRate = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useSession();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [blockedTimeFilter, setBlockedTimeFilter] = useState("consider");
  const [barberFilter, setBarberFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [viewType, setViewType] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Mock data - substituir por queries reais
  const [avgOpenTime, setAvgOpenTime] = useState<string>("00:00 h");
  const [openDays, setOpenDays] = useState<number>(0);
  const [avgAppointmentDuration, setAvgAppointmentDuration] = useState<string>("00:00 h");
  const [activeBarbers, setActiveBarbers] = useState<number>(0);
  const [completedAppointments, setCompletedAppointments] = useState<number>(0);
  const [maxCapacity, setMaxCapacity] = useState<number>(0);
  const [occupancyRate, setOccupancyRate] = useState<number>(0);
  const [chartData, setChartData] = useState<OccupancyData[]>([]);

  useEffect(() => {
    fetchRealData();
  }, [startDate, endDate]);

  const fetchRealData = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      // Buscar barbeiros reais
      const { data: barbersData, error: barbersError } = await supabase
        .from("technicians")
        .select("id, name")
        .eq("user_id", session.user.id);
      setActiveBarbers(barbersData?.length || 0);

      // Buscar agendamentos reais
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, appointment_date, status, technician_id")
        .eq("user_id", session.user.id)
        .gte("appointment_date", format(startDate, 'yyyy-MM-dd') + 'T00:00:00.000Z')
        .lte("appointment_date", format(endDate, 'yyyy-MM-dd') + 'T23:59:59.999Z');

      const completed = (appointmentsData || []).filter(a => a.status === 'completed' || a.status === 'finalized');
      setCompletedAppointments(completed.length);

      // Dias abertos
      const daysSet = new Set((appointmentsData || []).map(a => a.appointment_date?.slice(0,10)));
      setOpenDays(daysSet.size);

      // Duração média dos atendimentos (mock, pois não temos duration)
      setAvgAppointmentDuration("00:45 h");

      // Tempo médio aberto (mock, pois não temos hora de abertura)
      setAvgOpenTime("06:30 h");

      // Capacidade máxima (mock, pode ser calculada por barbeiros x slots/dia)
      setMaxCapacity((daysSet.size || 1) * (barbersData?.length || 1) * 10);

      // Taxa de ocupação
      setOccupancyRate(maxCapacity > 0 ? (completed.length / maxCapacity) * 100 : 0);

      // Dados para gráfico
      const chart: OccupancyData[] = [];
      daysSet.forEach(day => {
        const dayAppointments = (appointmentsData || []).filter(a => a.appointment_date?.startsWith(day));
        chart.push({
          date: day,
          rate: maxCapacity > 0 ? (dayAppointments.length / maxCapacity) * 100 : 0,
          appointments: dayAppointments.length,
          maxCapacity: maxCapacity,
        });
      });
      setChartData(chart);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from("technicians")
        .select("id, name")
        .eq("user_id", session.user.id)
        .order("name");

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    }
  };

  const handleSimulate = () => {
    setLoading(true);
    // Simular cálculo
    setTimeout(() => {
      setLoading(false);
      toast({
        title: t("calculation_completed"),
        description: t("occupancy_rate_calculated"),
      });
    }, 1000);
  };

  const getOccupancyColor = (rate: number) => {
    if (rate < 50) return "text-red-500";
    if (rate < 75) return "text-yellow-500";
    return "text-green-500";
  };

  const getOccupancyBgColor = (rate: number) => {
    if (rate < 50) return "from-red-500/10 to-red-600/10 border-red-500/20";
    if (rate < 75) return "from-yellow-500/10 to-yellow-600/10 border-yellow-500/20";
    return "from-green-500/10 to-green-600/10 border-green-500/20";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("occupancy_rate")}</h1>
          <p className="text-gray-400 mt-2">
            {t("occupancy_rate_description")}
          </p>
        </div>
        <Button
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
          onClick={handleSimulate}
          disabled={loading}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          {loading ? t("calculating") : t("simulate_occupancy")}
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{t("filters")}</CardTitle>
          <CardDescription className="text-gray-400">
            {t("configure_period_and_criteria")}
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

            {/* Horários Bloqueados */}
            <div className="space-y-2">
              <Label htmlFor="blocked-time" className="text-gray-300">
                {t("blocked_times")}
              </Label>
              <Select value={blockedTimeFilter} onValueChange={setBlockedTimeFilter}>
                <SelectTrigger
                  id="blocked-time"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="consider">{t("consider_in_calculation")}</SelectItem>
                  <SelectItem value="ignore">{t("ignore_in_calculation")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Barbeiro */}
            <div className="space-y-2">
              <Label htmlFor="barber" className="text-gray-300">
                {t("barber")}
              </Label>
              <Select value={barberFilter} onValueChange={setBarberFilter}>
                <SelectTrigger
                  id="barber"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">{t("all")}</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visualizar Por */}
            <div className="space-y-2">
              <Label htmlFor="view-type" className="text-gray-300">
                {t("view_by")}
              </Label>
              <Select value={viewType} onValueChange={setViewType}>
                <SelectTrigger
                  id="view-type"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="daily">{t("by_day")}</SelectItem>
                  <SelectItem value="weekly">{t("by_week")}</SelectItem>
                  <SelectItem value="monthly">{t("by_month")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("avg_open_time")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {avgOpenTime}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("during_open_days")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4" />
              {t("open_days")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {openDays} {t("days")}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("in_selected_period")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t("avg_appointment_duration")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-500">
              {avgAppointmentDuration}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("avg_per_client")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("active_barbers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {activeBarbers} {t("barbers")}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("in_your_shop")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("completed_appointments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {completedAppointments}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("in_selected_period")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border-indigo-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t("max_capacity")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-500">
              {maxCapacity}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("based_on_avg_time")}
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-gradient-to-br",
          getOccupancyBgColor(occupancyRate)
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t("occupancy_rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              getOccupancyColor(occupancyRate)
            )}>
              {occupancyRate.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("in_selected_period")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">{t("occupancy_rate")}</CardTitle>
              <CardDescription className="text-gray-400">
                {t("evolution_over_period")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("bar")}
                className={viewType === "bar" 
                  ? "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                  : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                }
              >
                {t("bar_chart")}
              </Button>
              <Button
                variant={viewType === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("line")}
                className={viewType === "line"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                  : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                }
              >
                {t("line_chart")}
              </Button>
              <Button
                variant={viewType === "area" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("area")}
                className={viewType === "area"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                  : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                }
              >
                {t("area_chart")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {viewType === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Legend />
                <Bar
                  dataKey="rate"
                  fill="#eab308"
                  radius={[8, 8, 0, 0]}
                  name={t("occupancy_rate")}
                />
              </BarChart>
            ) : viewType === "line" ? (
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
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#eab308"
                  strokeWidth={3}
                  dot={{ fill: "#eab308", r: 6 }}
                  name={t("occupancy_rate")}
                />
              </LineChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#eab308"
                  fillOpacity={1}
                  fill="url(#colorRate)"
                  name={t("occupancy_rate")}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{t("detailed_data")}</CardTitle>
          <CardDescription className="text-gray-400">
            {t("daily_breakdown")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">
                    {t("date")}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">
                    {t("appointments")}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">
                    {t("max_capacity")}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">
                    {t("occupancy_rate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((data, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-700 hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4 text-white">{data.date}</td>
                    <td className="py-3 px-4 text-right text-white">
                      {data.appointments}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {data.maxCapacity}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn("font-bold", getOccupancyColor(data.rate))}>
                        {data.rate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OccupancyRate;
