import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Search,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  User,
  Clock,
  FileText,
  Eye,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";

interface CashRegister {
  id: string;
  cashRegisterDate: string;
  createdBy: string;
  createdByName: string;
  openingTime: string;
  closingTime: string | null;
  openingBalance: number;
  closingBalance: number | null;
  totalSales: number;
  totalExpenses: number;
  cashRevenue: number;
  cardRevenue: number;
  pixRevenue: number;
  status: "open" | "closed" | "pending_approval";
  notes: string;
}

const CashRegisterReport = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [userFilter, setUserFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCashRegister, setSelectedCashRegister] = useState<CashRegister | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showChartsDialog, setShowChartsDialog] = useState(false);

  // Cores para gráficos
  const COLORS = ["#8b5cf6", "#f97316", "#06b6d4", "#10b981", "#ef4444"];

  // Mock data - substituir por queries reais do Supabase
  const mockCashRegisters: CashRegister[] = [
    {
      id: "1",
      cashRegisterDate: "2025-11-24",
      createdBy: "user1",
      createdByName: "João Silva",
      openingTime: "08:00",
      closingTime: "18:00",
      openingBalance: 100.0,
      closingBalance: 1250.5,
      totalSales: 1500.0,
      totalExpenses: 349.5,
      cashRevenue: 450.0,
      cardRevenue: 800.0,
      pixRevenue: 250.0,
      status: "closed",
      notes: "Dia tranquilo, sem problemas",
    },
    {
      id: "2",
      cashRegisterDate: "2025-11-23",
      createdBy: "user2",
      createdByName: "Maria Santos",
      openingTime: "08:30",
      closingTime: "19:00",
      openingBalance: 100.0,
      closingBalance: 1580.0,
      totalSales: 1850.0,
      totalExpenses: 370.0,
      cashRevenue: 620.0,
      cardRevenue: 950.0,
      pixRevenue: 280.0,
      status: "closed",
      notes: "Sábado movimentado",
    },
    {
      id: "3",
      cashRegisterDate: "2025-11-22",
      createdBy: "user1",
      createdByName: "João Silva",
      openingTime: "08:00",
      closingTime: "18:30",
      openingBalance: 100.0,
      closingBalance: 980.0,
      totalSales: 1200.0,
      totalExpenses: 320.0,
      cashRevenue: 380.0,
      cardRevenue: 650.0,
      pixRevenue: 170.0,
      status: "closed",
      notes: "",
    },
    {
      id: "4",
      cashRegisterDate: "2025-11-21",
      createdBy: "user3",
      createdByName: "Pedro Costa",
      openingTime: "08:00",
      closingTime: null,
      openingBalance: 100.0,
      closingBalance: null,
      totalSales: 850.0,
      totalExpenses: 0,
      cashRevenue: 300.0,
      cardRevenue: 450.0,
      pixRevenue: 100.0,
      status: "open",
      notes: "",
    },
    {
      id: "5",
      cashRegisterDate: "2025-11-20",
      createdBy: "user2",
      createdByName: "Maria Santos",
      openingTime: "08:30",
      closingTime: "18:45",
      openingBalance: 100.0,
      closingBalance: 1120.0,
      totalSales: 1350.0,
      totalExpenses: 330.0,
      cashRevenue: 420.0,
      cardRevenue: 720.0,
      pixRevenue: 210.0,
      status: "pending_approval",
      notes: "Aguardando conferência do gerente",
    },
  ];

  const [filteredCashRegisters, setFilteredCashRegisters] =
    useState<CashRegister[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // TODO: Carregar usuários quando a tabela profiles existir
      // const { data: usersData, error: usersError } = await supabase
      //   .from("profiles")
      //   .select("id, name");
      // if (usersError) throw usersError;
      // setUsers(usersData || []);

      // Usar mock data por enquanto (substituir quando tabela cash_registers existir)
      setCashRegisters(mockCashRegisters);
      setFilteredCashRegisters(mockCashRegisters);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // Usar mock data em caso de erro
      setCashRegisters(mockCashRegisters);
      setFilteredCashRegisters(mockCashRegisters);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas calculadas
  const totalSalesSum = filteredCashRegisters.reduce(
    (sum, cr) => sum + cr.totalSales,
    0
  );
  const totalExpensesSum = filteredCashRegisters.reduce(
    (sum, cr) => sum + cr.totalExpenses,
    0
  );
  const totalCashSum = filteredCashRegisters.reduce(
    (sum, cr) => sum + cr.cashRevenue,
    0
  );
  const totalCardSum = filteredCashRegisters.reduce(
    (sum, cr) => sum + cr.cardRevenue,
    0
  );
  const totalPixSum = filteredCashRegisters.reduce(
    (sum, cr) => sum + cr.pixRevenue,
    0
  );
  const netBalance = totalSalesSum - totalExpensesSum;

  const handleSearch = () => {
    let filtered = cashRegisters;

    if (startDate) {
      filtered = filtered.filter(
        (cr) =>
          new Date(cr.cashRegisterDate) >= new Date(startDate.toDateString())
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (cr) => new Date(cr.cashRegisterDate) <= new Date(endDate.toDateString())
      );
    }

    if (userFilter !== "all") {
      filtered = filtered.filter((cr) => cr.createdBy === userFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((cr) => cr.status === statusFilter);
    }

    setFilteredCashRegisters(filtered);
  };

  // Preparar dados para gráficos
  const chartData = filteredCashRegisters
    .sort((a, b) => new Date(a.cashRegisterDate).getTime() - new Date(b.cashRegisterDate).getTime())
    .map((cr) => ({
      date: format(new Date(cr.cashRegisterDate), "dd/MM", { locale: ptBR }),
      vendas: cr.totalSales,
      despesas: cr.totalExpenses,
      saldo: cr.totalSales - cr.totalExpenses,
    }));

  const paymentMethodData = [
    { name: t("cash"), value: totalCashSum, color: "#8b5cf6" },
    { name: t("card"), value: totalCardSum, color: "#f97316" },
    { name: t("pix"), value: totalPixSum, color: "#06b6d4" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            {t("open")}
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            {t("closed")}
          </Badge>
        );
      case "pending_approval":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            {t("pending")}
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleExport = () => {
    try {
      // Preparar dados para exportação
      const exportData = filteredCashRegisters.map((cr) => ({
        "Data do Caixa": format(new Date(cr.cashRegisterDate), "dd/MM/yyyy", { locale: ptBR }),
        "Criado Por": cr.createdByName,
        "Abertura": cr.openingTime,
        "Fechamento": cr.closingTime || "-",
        "Saldo Abertura": cr.openingBalance,
        "Vendas Totais": cr.totalSales,
        "Despesas": cr.totalExpenses,
        "Dinheiro": cr.cashRevenue,
        "Cartão": cr.cardRevenue,
        "PIX": cr.pixRevenue,
        "Saldo Final": cr.closingBalance || "-",
        "Status": cr.status === "open" ? "Aberto" : cr.status === "closed" ? "Fechado" : "Pendente",
        "Observações": cr.notes,
      }));

      // Criar workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatório de Caixas");

      // Adicionar resumo
      const summaryData = [
        { Campo: "Total de Vendas", Valor: `R$ ${totalSalesSum.toFixed(2)}` },
        { Campo: "Total de Despesas", Valor: `R$ ${totalExpensesSum.toFixed(2)}` },
        { Campo: "Saldo Líquido", Valor: `R$ ${netBalance.toFixed(2)}` },
        { Campo: "Total Dinheiro", Valor: `R$ ${totalCashSum.toFixed(2)}` },
        { Campo: "Total Cartão", Valor: `R$ ${totalCardSum.toFixed(2)}` },
        { Campo: "Total PIX", Valor: `R$ ${totalPixSum.toFixed(2)}` },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

      // Download
      const fileName = `relatorio-caixas-${format(new Date(), "dd-MM-yyyy-HHmm")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: t("export_completed"),
        description: `${t("file_downloaded")} ${fileName}`,
      });
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast({
        title: t("export_error"),
        description: t("export_error_description"),
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const viewDetails = (cashRegister: CashRegister) => {
    setSelectedCashRegister(cashRegister);
    setShowDetailsDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t("cash_register_report_title")}</h1>
        <p className="text-gray-400 mt-2">
          {t("cash_register_report_description")}
        </p>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{t("search_filters")}</CardTitle>
          <CardDescription className="text-gray-400">
            {t("search_filters_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    onSelect={setStartDate}
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
                    onSelect={setEndDate}
                    initialFocus
                    locale={ptBR}
                    className="bg-gray-800"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtro por Usuário */}
            <div className="space-y-2">
              <Label htmlFor="user-filter" className="text-gray-300">
                {t("filter_by_user")}
              </Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger
                  id="user-filter"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue placeholder={t("all")} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="user1">João Silva</SelectItem>
                  <SelectItem value="user2">Maria Santos</SelectItem>
                  <SelectItem value="user3">Pedro Costa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Status */}
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-gray-300">
                {t("filter_by_status")}
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  id="status-filter"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue placeholder={t("all")} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="open">{t("open")}</SelectItem>
                  <SelectItem value="closed">{t("closed")}</SelectItem>
                  <SelectItem value="pending_approval">{t("pending")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSearch}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
              disabled={loading}
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? t("loading") : t("search")}
            </Button>
            <Button
              onClick={() => setShowChartsDialog(true)}
              variant="outline"
              className="bg-purple-700 border-purple-600 text-white hover:bg-purple-600"
              disabled={filteredCashRegisters.length === 0}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {t("view_charts")}
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              disabled={filteredCashRegisters.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <Printer className="mr-2 h-4 w-4" />
              {t("print")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("total_sales")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {totalSalesSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {filteredCashRegisters.length} {t("cash_registers").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              {t("total_expenses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              R$ {totalExpensesSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-400 mt-1">{t("total_expenses")}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("net_balance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              netBalance >= 0 ? "text-blue-500" : "text-red-500"
            )}>
              R$ {netBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-400 mt-1">{t("sales_minus_expenses")}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("cash")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              R$ {totalCashSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {((totalCashSum / totalSalesSum) * 100).toFixed(1)}% {t("of_total")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("card")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              R$ {totalCardSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {((totalCardSum / totalSalesSum) * 100).toFixed(1)}% {t("of_total")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("pix")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-500">
              R$ {totalPixSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {((totalPixSum / totalSalesSum) * 100).toFixed(1)}% {t("of_total")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resultados */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("cash_registers")}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {filteredCashRegisters.length} {t("records_found")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCashRegisters.length > 0 ? (
            <div className="rounded-md border border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-700/50 hover:bg-gray-700/50 border-gray-700">
                    <TableHead className="text-gray-300 font-semibold">
                      {t("created_by").toUpperCase()}
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold">
                      {t("cash_register_date").toUpperCase()}
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold">
                      {t("opening").toUpperCase()}
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold">
                      {t("closing").toUpperCase()}
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold text-right">
                      {t("sales").toUpperCase()}
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold text-right">
                      {t("expenses").toUpperCase()}
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold text-right">
                      {t("final_balance").toUpperCase()}
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold text-center">
                      {t("status").toUpperCase()}
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold text-center">
                      {t("actions").toUpperCase()}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCashRegisters.map((cashRegister) => (
                    <TableRow
                      key={cashRegister.id}
                      className="border-gray-700 hover:bg-gray-700/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-white font-medium">
                            {cashRegister.createdByName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {format(
                          new Date(cashRegister.cashRegisterDate),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {cashRegister.openingTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {cashRegister.closingTime || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-green-500 font-medium">
                        R${" "}
                        {cashRegister.totalSales.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-red-500 font-medium">
                        R${" "}
                        {cashRegister.totalExpenses.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-white font-semibold">
                        R${" "}
                        {cashRegister.closingBalance
                          ? cashRegister.closingBalance.toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                              }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(cashRegister.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(cashRegister)}
                          className="hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4 text-gray-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">{t("no_data_found")}</p>
              <p className="text-gray-500 text-sm mt-2">
                {t("adjust_filters")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              {t("cash_register_details")}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t("complete_cash_register_info")}
            </DialogDescription>
          </DialogHeader>
          {selectedCashRegister && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">{t("cash_register_date")}</Label>
                  <p className="text-white font-medium">
                    {format(new Date(selectedCashRegister.cashRegisterDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">{t("operator")}</Label>
                  <p className="text-white font-medium">
                    {selectedCashRegister.createdByName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">{t("opening_time")}</Label>
                  <p className="text-white font-medium">
                    {selectedCashRegister.openingTime}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">{t("closing_time")}</Label>
                  <p className="text-white font-medium">
                    {selectedCashRegister.closingTime || t("in_progress")}
                  </p>
                </div>
              </div>

              {/* Valores */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-white font-semibold mb-4">{t("values")}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <Label className="text-gray-400 text-sm">{t("opening_balance")}</Label>
                    <p className="text-white font-bold text-xl mt-1">
                      R${" "}
                      {selectedCashRegister.openingBalance.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <Label className="text-gray-400 text-sm">{t("closing_balance")}</Label>
                    <p className="text-white font-bold text-xl mt-1">
                      {selectedCashRegister.closingBalance
                        ? `R$ ${selectedCashRegister.closingBalance.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Receitas por Forma de Pagamento */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-white font-semibold mb-4">
                  {t("revenue_by_payment_method")}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
                    <Label className="text-purple-400 text-sm">{t("cash")}</Label>
                    <p className="text-white font-bold text-lg mt-1">
                      R${" "}
                      {selectedCashRegister.cashRevenue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
                    <Label className="text-orange-400 text-sm">{t("card")}</Label>
                    <p className="text-white font-bold text-lg mt-1">
                      R${" "}
                      {selectedCashRegister.cardRevenue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-lg">
                    <Label className="text-cyan-400 text-sm">{t("pix")}</Label>
                    <p className="text-white font-bold text-lg mt-1">
                      R${" "}
                      {selectedCashRegister.pixRevenue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Totais */}
              <div className="border-t border-gray-700 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                    <Label className="text-green-400 text-sm">{t("total_sales")}</Label>
                    <p className="text-green-500 font-bold text-2xl mt-1">
                      R${" "}
                      {selectedCashRegister.totalSales.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                    <Label className="text-red-400 text-sm">{t("total_expenses")}</Label>
                    <p className="text-red-500 font-bold text-2xl mt-1">
                      R${" "}
                      {selectedCashRegister.totalExpenses.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedCashRegister.notes && (
                <div className="border-t border-gray-700 pt-4">
                  <Label className="text-gray-400 text-sm">{t("notes")}</Label>
                  <p className="text-white mt-2 bg-gray-900 p-3 rounded-lg">
                    {selectedCashRegister.notes}
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
                <Label className="text-gray-400 text-sm">{t("status")}</Label>
                {getStatusBadge(selectedCashRegister.status)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Gráficos */}
      <Dialog open={showChartsDialog} onOpenChange={setShowChartsDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              {t("chart_analysis")}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t("chart_analysis_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Gráfico de Evolução de Vendas e Despesas */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {t("sales_vs_expenses_evolution")}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {t("daily_comparison")}
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
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="vendas"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Vendas"
                    />
                    <Line
                      type="monotone"
                      dataKey="despesas"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Despesas"
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Saldo"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráficos de Barras e Pizza */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">{t("sales_per_day")}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {t("daily_sales_volume")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
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
                      />
                      <Bar dataKey="vendas" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Pizza */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    {t("payment_methods")}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {t("distribution_by_payment_method")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) =>
                          `R$ ${value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {paymentMethodData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-gray-300">{item.name}</span>
                        </div>
                        <span className="text-white font-medium">
                          R${" "}
                          {item.value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashRegisterReport;
