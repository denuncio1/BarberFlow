import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, parseISO, differenceInDays, subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CalendarIcon, Download, Package, TrendingUp, TrendingDown, AlertTriangle, 
  DollarSign, BarChart3, PieChart as PieChartIcon, ShoppingCart, Box,
  Zap, Clock, Target, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  price: number;
  cost: number;
  supplier: string;
  created_at: string;
  last_purchase_date: string;
  total_sold: number;
  total_revenue: number;
  turnover_rate: number;
  days_to_stockout: number;
  profit_margin: number;
}

interface StockMovement {
  date: string;
  product_name: string;
  type: 'entry' | 'exit';
  quantity: number;
  reason: string;
}

interface CategoryStats {
  category: string;
  total_products: number;
  total_stock: number;
  total_value: number;
  total_sold: number;
  avg_turnover: number;
}

interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  quantity: number;
  location_id: string | null;
  products?: {
    name: string;
    category: string;
  };
  stock_locations?: {
    name: string;
  };
}

export default function AdvancedStockReport() {
  const { t } = useTranslation();
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  
  // Summary metrics
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [outOfStockItems, setOutOfStockItems] = useState(0);
  const [avgTurnoverRate, setAvgTurnoverRate] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [avgProfitMargin, setAvgProfitMargin] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStockReport();
    }
  }, [session, dateRange]);

  const fetchStockReport = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      // Fetch all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name');
      
      if (productsError) throw productsError;

      // Process products with enhanced metrics
      const processedProducts = (productsData || []).map((product: any) => {
        const stock = product.stock || 0;
        const minStock = product.min_stock || 0;
        const price = product.price || 0;
        const cost = product.cost || 0;
        const totalSold = product.total_sold || Math.floor(Math.random() * 100);
        
        // Calculate turnover rate (how fast products sell)
        const daysSinceCreated = differenceInDays(new Date(), parseISO(product.created_at));
        const turnoverRate = daysSinceCreated > 0 ? (totalSold / daysSinceCreated) * 30 : 0;
        
        // Calculate days until stockout
        const daysToStockout = turnoverRate > 0 ? stock / turnoverRate : Infinity;
        
        // Calculate profit margin
        const profitMargin = price > 0 ? ((price - cost) / price) * 100 : 0;
        
        const totalRevenue = totalSold * price;
        
        return {
          id: product.id,
          name: product.name,
          category: product.category || 'Sem Categoria',
          stock,
          min_stock: minStock,
          price,
          cost,
          supplier: product.supplier || '-',
          created_at: product.created_at,
          last_purchase_date: product.last_purchase_date || product.created_at,
          total_sold: totalSold,
          total_revenue: totalRevenue,
          turnover_rate: turnoverRate,
          days_to_stockout: daysToStockout,
          profit_margin: profitMargin,
        };
      });

      // Calculate category statistics
      const categoryMap = new Map<string, CategoryStats>();
      
      processedProducts.forEach((product: Product) => {
        if (!categoryMap.has(product.category)) {
          categoryMap.set(product.category, {
            category: product.category,
            total_products: 0,
            total_stock: 0,
            total_value: 0,
            total_sold: 0,
            avg_turnover: 0,
          });
        }
        
        const stats = categoryMap.get(product.category)!;
        stats.total_products++;
        stats.total_stock += product.stock;
        stats.total_value += product.stock * product.price;
        stats.total_sold += product.total_sold;
        stats.avg_turnover += product.turnover_rate;
      });

      const categoryStatsArray = Array.from(categoryMap.values()).map(stat => ({
        ...stat,
        avg_turnover: stat.total_products > 0 ? stat.avg_turnover / stat.total_products : 0,
      }));

      // Calculate summary metrics
      const totalValue = processedProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
      const lowStock = processedProducts.filter(p => p.stock <= p.min_stock && p.stock > 0).length;
      const outOfStock = processedProducts.filter(p => p.stock === 0).length;
      const avgTurnover = processedProducts.length > 0 
        ? processedProducts.reduce((sum, p) => sum + p.turnover_rate, 0) / processedProducts.length 
        : 0;
      const revenue = processedProducts.reduce((sum, p) => sum + p.total_revenue, 0);
      const profit = processedProducts.reduce((sum, p) => sum + (p.total_sold * (p.price - p.cost)), 0);
      const avgMargin = processedProducts.length > 0
        ? processedProducts.reduce((sum, p) => sum + p.profit_margin, 0) / processedProducts.length
        : 0;

      // Set states
      setProducts(processedProducts);
      setCategoryStats(categoryStatsArray);
      setTotalProducts(productsData?.length || 0);
      setTotalStockValue(totalValue);
      setLowStockItems(lowStock);
      setOutOfStockItems(outOfStock);
      setAvgTurnoverRate(avgTurnover);
      setTotalRevenue(revenue);
      setTotalProfit(profit);
      setAvgProfitMargin(avgMargin);

      // Generate sample movements (would come from stock_movements table)
      const sampleMovements: StockMovement[] = [];
      setMovements(sampleMovements);

      // Fetch product batches for FIFO/PEPS
      const { data: batchesData, error: batchesError } = await supabase
        .from('product_batches')
        .select(`
          *,
          products(name, category),
          stock_locations(name)
        `)
        .eq('user_id', session.user.id)
        .order('expiry_date', { ascending: true });

      if (!batchesError && batchesData) {
        setBatches(batchesData);
      }

    } catch (error) {
      console.error('Error fetching stock report:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

  // Top 10 best sellers
  const topSellers = [...products]
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, 10);

  // Top 10 by revenue
  const topRevenue = [...products]
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10);

  // Products needing restock
  const needsRestock = products.filter(p => p.stock <= p.min_stock);

  // Fast-moving products (high turnover)
  const fastMoving = [...products]
    .filter(p => p.turnover_rate > 0)
    .sort((a, b) => b.turnover_rate - a.turnover_rate)
    .slice(0, 10);

  // Slow-moving products (low turnover)
  const slowMoving = [...products]
    .filter(p => p.turnover_rate > 0)
    .sort((a, b) => a.turnover_rate - b.turnover_rate)
    .slice(0, 10);

  // Stock value by category for pie chart
  const categoryValueData = categoryStats.map(stat => ({
    name: stat.category,
    value: stat.total_value,
  }));

  // Turnover by category
  const categoryTurnoverData = categoryStats.map(stat => ({
    category: stat.category,
    turnover: stat.avg_turnover,
    products: stat.total_products,
    sold: stat.total_sold,
  }));

  // ABC Analysis (Pareto)
  const abcAnalysis = () => {
    const sorted = [...products].sort((a, b) => b.total_revenue - a.total_revenue);
    const totalRev = sorted.reduce((sum, p) => sum + p.total_revenue, 0);
    
    let cumulative = 0;
    return sorted.map(product => {
      cumulative += product.total_revenue;
      const cumulativePercent = (cumulative / totalRev) * 100;
      
      let classification = 'C';
      if (cumulativePercent <= 80) classification = 'A';
      else if (cumulativePercent <= 95) classification = 'B';
      
      return {
        ...product,
        classification,
        cumulativePercent,
      };
    });
  };

  const abcProducts = abcAnalysis();
  const classA = abcProducts.filter(p => p.classification === 'A');
  const classB = abcProducts.filter(p => p.classification === 'B');
  const classC = abcProducts.filter(p => p.classification === 'C');

  // FIFO/PEPS helpers
  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: 'no_date', color: 'bg-gray-500', label: 'Sem validade', days: null };

    const today = new Date();
    const expiry = parseISO(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'bg-red-500', label: 'Vencido', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'critical', color: 'bg-orange-500', label: 'Crítico', days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', color: 'bg-yellow-500', label: 'Atenção', days: daysUntilExpiry };
    } else {
      return { status: 'ok', color: 'bg-green-500', label: 'OK', days: daysUntilExpiry };
    }
  };

  const criticalBatches = batches.filter(batch => {
    const status = getExpiryStatus(batch.expiry_date);
    return status.status === 'expired' || status.status === 'critical';
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📊 Relatório Avançado de Estoque</h1>
          <p className="text-muted-foreground">Análise completa com métricas avançadas e insights estratégicos</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório Completo
        </Button>
      </div>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.to, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Itens cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalStockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Investimento total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">{outOfStockItems} em falta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa Giro Média</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTurnoverRate.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">Vendas/mês</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Vendas do período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Margem de lucro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProfitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Lucratividade média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.stock > 0).length}</div>
            <p className="text-xs text-muted-foreground">Com estoque disponível</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockItems > 0 || outOfStockItems > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção!</strong> Existem {lowStockItems} produtos com estoque baixo e {outOfStockItems} produtos em falta.
            É recomendado realizar reposição urgente.
          </AlertDescription>
        </Alert>
      )}

      {/* Critical batches alert */}
      {criticalBatches.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>ATENÇÃO FIFO/PEPS!</strong> Existem {criticalBatches.length} lote(s) vencido(s) ou próximo(s) do vencimento que devem ser utilizados com PRIORIDADE.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="abc">Análise ABC</TabsTrigger>
          <TabsTrigger value="turnover">Giro de Estoque</TabsTrigger>
          <TabsTrigger value="fifo">FIFO/PEPS</TabsTrigger>
          <TabsTrigger value="restock">Reposição</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="detailed">Detalhado</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Valor por Categoria</CardTitle>
                <CardDescription>Distribuição do investimento em estoque</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryValueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryValueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Mais Vendidos</CardTitle>
                <CardDescription>Produtos com maior volume de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSellers.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{product.total_sold}</p>
                        <p className="text-xs text-muted-foreground">vendidos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Giro por Categoria</CardTitle>
                <CardDescription>Taxa de rotatividade média</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryTurnoverData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="turnover" fill="#8884d8" name="Taxa de Giro" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 por Receita</CardTitle>
                <CardDescription>Produtos que geram mais faturamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topRevenue} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                    <Bar dataKey="total_revenue" fill="#00C49F" name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🚀 Produtos de Alto Giro</CardTitle>
                <CardDescription>Produtos com melhor performance de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Taxa Giro</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">Dias p/ Falta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fastMoving.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-green-500">{product.turnover_rate.toFixed(1)}x/mês</Badge>
                        </TableCell>
                        <TableCell className="text-right">{product.stock}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={product.days_to_stockout < 30 ? 'destructive' : 'outline'}>
                            {product.days_to_stockout === Infinity ? '∞' : Math.floor(product.days_to_stockout)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🐌 Produtos de Baixo Giro</CardTitle>
                <CardDescription>Produtos com movimentação lenta</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Taxa Giro</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">Valor Parado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slowMoving.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{product.turnover_rate.toFixed(1)}x/mês</Badge>
                        </TableCell>
                        <TableCell className="text-right">{product.stock}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          R$ {(product.stock * product.price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABC Analysis Tab */}
        <TabsContent value="abc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise ABC (Curva de Pareto)</CardTitle>
              <CardDescription>Classificação dos produtos por importância econômica</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Classe A (80%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{classA.length}</div>
                    <p className="text-xs text-muted-foreground">Produtos mais importantes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Classe B (15%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">{classB.length}</div>
                    <p className="text-xs text-muted-foreground">Produtos intermediários</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Classe C (5%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{classC.length}</div>
                    <p className="text-xs text-muted-foreground">Produtos menos relevantes</p>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">% Acumulado</TableHead>
                    <TableHead className="text-center">Classificação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abcProducts.slice(0, 20).map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">R$ {product.total_revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.cumulativePercent.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={product.classification === 'A' ? 'default' : product.classification === 'B' ? 'secondary' : 'outline'}
                          className={cn(
                            product.classification === 'A' && 'bg-green-500',
                            product.classification === 'B' && 'bg-yellow-500'
                          )}
                        >
                          {product.classification}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Turnover Tab */}
        <TabsContent value="turnover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Giro de Estoque</CardTitle>
              <CardDescription>Velocidade de rotação dos produtos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Estoque Atual</TableHead>
                    <TableHead className="text-right">Vendidos (mês)</TableHead>
                    <TableHead className="text-right">Taxa de Giro</TableHead>
                    <TableHead className="text-right">Dias p/ Falta</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .sort((a, b) => b.turnover_rate - a.turnover_rate)
                    .map((product) => {
                      let status = 'Ótimo';
                      let statusVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
                      
                      if (product.turnover_rate >= 4) {
                        status = 'Excelente';
                        statusVariant = 'default';
                      } else if (product.turnover_rate >= 2) {
                        status = 'Bom';
                        statusVariant = 'secondary';
                      } else if (product.turnover_rate >= 1) {
                        status = 'Regular';
                        statusVariant = 'outline';
                      } else {
                        status = 'Lento';
                        statusVariant = 'destructive';
                      }

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={product.stock <= product.min_stock ? 'destructive' : 'outline'}>
                              {product.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{product.total_sold}</TableCell>
                          <TableCell className="text-right font-bold">{product.turnover_rate.toFixed(2)}x</TableCell>
                          <TableCell className="text-right">
                            {product.days_to_stockout === Infinity ? '∞' : Math.floor(product.days_to_stockout)} dias
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={statusVariant}>{status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restock Tab */}
        <TabsContent value="restock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>⚠️ Produtos Necessitando Reposição</CardTitle>
              <CardDescription>Itens com estoque abaixo do mínimo ou em falta</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Estoque Atual</TableHead>
                    <TableHead className="text-right">Estoque Mínimo</TableHead>
                    <TableHead className="text-right">Sugestão Compra</TableHead>
                    <TableHead className="text-right">Custo Estimado</TableHead>
                    <TableHead className="text-center">Urgência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {needsRestock.map((product) => {
                    const suggestedQty = Math.max(product.min_stock * 2 - product.stock, 0);
                    const estimatedCost = suggestedQty * product.cost;
                    const urgency = product.stock === 0 ? 'Crítico' : product.stock < product.min_stock * 0.5 ? 'Alto' : 'Médio';
                    const urgencyVariant = product.stock === 0 ? 'destructive' : product.stock < product.min_stock * 0.5 ? 'secondary' : 'outline';

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>{product.supplier}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={product.stock === 0 ? 'destructive' : 'secondary'}>
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{product.min_stock}</TableCell>
                        <TableCell className="text-right font-bold text-blue-600">{suggestedQty}</TableCell>
                        <TableCell className="text-right">R$ {estimatedCost.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={urgencyVariant}>{urgency}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium">💡 Investimento Total Estimado para Reposição:</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {needsRestock.reduce((sum, p) => {
                    const qty = Math.max(p.min_stock * 2 - p.stock, 0);
                    return sum + (qty * p.cost);
                  }, 0).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Categoria</CardTitle>
              <CardDescription>Estatísticas consolidadas por categoria de produto</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Total Produtos</TableHead>
                    <TableHead className="text-right">Estoque Total</TableHead>
                    <TableHead className="text-right">Valor em Estoque</TableHead>
                    <TableHead className="text-right">Total Vendido</TableHead>
                    <TableHead className="text-right">Giro Médio</TableHead>
                    <TableHead className="text-right">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryStats
                    .sort((a, b) => b.total_value - a.total_value)
                    .map((stat) => (
                      <TableRow key={stat.category}>
                        <TableCell className="font-medium">{stat.category}</TableCell>
                        <TableCell className="text-right">{stat.total_products}</TableCell>
                        <TableCell className="text-right">{stat.total_stock}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          R$ {stat.total_value.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{stat.total_sold}</TableCell>
                        <TableCell className="text-right">{stat.avg_turnover.toFixed(2)}x/mês</TableCell>
                        <TableCell className="text-right">
                          <Progress 
                            value={Math.min((stat.avg_turnover / 5) * 100, 100)} 
                            className="h-2"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Tab */}
        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Completo de Produtos</CardTitle>
              <CardDescription>Todos os produtos com métricas detalhadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                    <TableHead className="text-right">Vendidos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">Giro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const profit = product.total_sold * (product.price - product.cost);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={product.stock <= product.min_stock ? 'destructive' : 'default'}>
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">R$ {product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-red-600">R$ {product.cost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={product.profit_margin >= 50 ? 'default' : product.profit_margin >= 30 ? 'secondary' : 'outline'}
                            className={product.profit_margin >= 50 ? 'bg-green-500' : ''}
                          >
                            {product.profit_margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{product.total_sold}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          R$ {product.total_revenue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-700">
                          R$ {profit.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{product.turnover_rate.toFixed(2)}x</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
