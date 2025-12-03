"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Download, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Award,
  Eye,
  ChevronRight,
  FileText,
  Percent
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';

interface Technician {
  id: string;
  name: string;
  avatar_url: string | null;
  color: string | null;
}

interface CollaboratorStats {
  technician_id: string;
  technician_name: string;
  avatar_url: string | null;
  color: string | null;
  total_sales: number;
  total_appointments: number;
  finished_appointments: number;
  commission_services: number;
  commission_products: number;
  commission_signatures: number;
  commission_pending: number;
  total_commissions: number;
  commission_paid: number;
  product_sales: number;
  normal_commissions: number;
  total_extras: number;
  product_purchases: number;
  total_vales: number;
  total_paid_commissions: number;
  pending_commissions: number;
  points_total: number;
}

const CollaboratorsReport = () => {
  const { session, isLoading, user } = useSession();
  const { t } = useTranslation();
  const [collaborators, setCollaborators] = useState<CollaboratorStats[]>([]);
  const [filteredCollaborators, setFilteredCollaborators] = useState<CollaboratorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);

  // Totals
  const [totals, setTotals] = useState({
    total_sales: 0,
    total_services_sold: 0,
    total_products_sold: 0,
    total_signatures_commission: 0,
    total_commissions: 0,
    total_pending_commissions: 0,
    total_commissions_paid: 0,
    total_vales: 0,
  });

  useEffect(() => {
    if (user) {
      fetchCollaboratorsReport();
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    applyFilters();
  }, [collaborators, searchTerm, filterType]);

  const fetchCollaboratorsReport = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all technicians
      const { data: technicians, error: techError } = await supabase
        .from('technicians')
        .select('id, name, avatar_url, color')
        .eq('user_id', user.id)
        .order('name');

      if (techError) throw techError;

      // Fetch appointments data
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select(`
          id,
          technician_id,
          status,
          signature_used,
          appointment_date,
          service_id
        `)
        .eq('user_id', user.id)
        .gte('appointment_date', `${startDate}T00:00:00`)
        .lte('appointment_date', `${endDate}T23:59:59`)
        .in('status', ['completed', 'confirmed']);

      if (aptError) throw aptError;

      // Fetch all service prices
      const serviceIds = (appointments || []).map((apt: any) => apt.service_id).filter(Boolean);
      let servicePrices: Record<string, number> = {};
      
      if (serviceIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, price')
          .in('id', serviceIds);
        
        servicePrices = (servicesData || []).reduce((acc: Record<string, number>, service: any) => {
          acc[service.id] = service.price || 0;
          return acc;
        }, {});
      }

      // Process data for each technician
      const statsPromises = (technicians || []).map(async (tech: Technician) => {
        const techAppointments = (appointments || []).filter(apt => apt.technician_id === tech.id);
        
        // Calculate total sales from service prices
        const totalSales = techAppointments.reduce((sum, apt: any) => {
          const servicePrice = servicePrices[apt.service_id] || 0;
          return sum + servicePrice;
        }, 0);
        
        const totalAppointments = techAppointments.length;
        const finishedAppointments = techAppointments.filter(apt => apt.status === 'completed').length;

        // Calculate commissions (assuming 10% default commission rate)
        const defaultCommissionRate = 10;
        const commissionServices = techAppointments
          .filter((apt: any) => !apt.signature_used)
          .reduce((sum, apt: any) => {
            const servicePrice = servicePrices[apt.service_id] || 0;
            return sum + (servicePrice * defaultCommissionRate / 100);
          }, 0);

        const commissionSignatures = techAppointments
          .filter((apt: any) => apt.signature_used)
          .reduce((sum, apt: any) => {
            const servicePrice = servicePrices[apt.service_id] || 0;
            return sum + (servicePrice * defaultCommissionRate / 100);
          }, 0);

        // Fetch product sales (if exists)
        // TODO: Create appointment_products table for product sales tracking
        const productSales: any[] = [];
        
        const productSalesTotal = (productSales || []).reduce(
          (sum, ps) => sum + (ps.quantity * ps.unit_price), 0
        );

        const commissionProducts = productSalesTotal * 0.1; // Assuming 10% commission on products

        // Fetch paid commissions
        const { data: payments } = await supabase
          .from('commission_payments')
          .select('amount')
          .eq('technician_id', tech.id)
          .gte('payment_date', startDate)
          .lte('payment_date', endDate);

        const commissionPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

        const totalCommissions = commissionServices + commissionProducts + commissionSignatures;
        const pendingCommissions = totalCommissions - commissionPaid;

        // Calculate points (mock)
        const pointsTotal = finishedAppointments * 10;

        return {
          technician_id: tech.id,
          technician_name: tech.name,
          avatar_url: tech.avatar_url,
          color: tech.color,
          total_sales: totalSales,
          total_appointments: totalAppointments,
          finished_appointments: finishedAppointments,
          commission_services: commissionServices,
          commission_products: commissionProducts,
          commission_signatures: commissionSignatures,
          commission_pending: pendingCommissions,
          total_commissions: totalCommissions,
          commission_paid: commissionPaid,
          product_sales: productSalesTotal,
          normal_commissions: commissionServices,
          total_extras: 0,
          product_purchases: 0,
          total_vales: 0,
          total_paid_commissions: commissionPaid,
          pending_commissions: pendingCommissions,
          points_total: pointsTotal,
        } as CollaboratorStats;
      });

      const stats = await Promise.all(statsPromises);
      setCollaborators(stats);

      // Calculate totals
      const newTotals = {
        total_sales: stats.reduce((sum, s) => sum + s.total_sales, 0),
        total_services_sold: stats.reduce((sum, s) => sum + s.commission_services, 0),
        total_products_sold: stats.reduce((sum, s) => sum + s.product_sales, 0),
        total_signatures_commission: stats.reduce((sum, s) => sum + s.commission_signatures, 0),
        total_commissions: stats.reduce((sum, s) => sum + s.total_commissions, 0),
        total_pending_commissions: stats.reduce((sum, s) => sum + s.pending_commissions, 0),
        total_commissions_paid: stats.reduce((sum, s) => sum + s.commission_paid, 0),
        total_vales: stats.reduce((sum, s) => sum + s.total_vales, 0),
      };
      setTotals(newTotals);

    } catch (error: any) {
      console.error('Erro ao buscar relatório de colaboradores:', error);
      showError('Erro ao carregar relatório: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...collaborators];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.technician_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.technician_id === filterType);
    }

    setFilteredCollaborators(filtered);
  };

  const exportToExcel = () => {
    showSuccess('Exportação para Excel em desenvolvimento!');
  };

  const handleClearCommission = () => {
    showSuccess('Funcionalidade de limpar comissões em desenvolvimento!');
  };

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const commissionBreakdownData = [
    { name: 'Vendas serviços', value: totals.total_services_sold, color: chartColors[0] },
    { name: 'Comissões normais', value: totals.total_services_sold, color: chartColors[1] },
    { name: 'Vendas produto', value: totals.total_products_sold, color: chartColors[2] },
    { name: 'Comissões assinaturas', value: totals.total_signatures_commission, color: chartColors[3] },
  ].filter(item => item.value > 0);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">COLLABORATORS_REPORT</h1>
            <p className="text-gray-400">Unidade: SELECT BARBER CLUB</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleClearCommission}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            >
              <Award className="h-4 w-4 mr-2" />
              CLEARED_COMISSION
            </Button>
            <Button 
              onClick={exportToExcel}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar em excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400 mb-1">Sales</div>
              <div className="text-sm text-gray-400">Total</div>
              <div className="text-xl font-bold text-green-400">
                R$ {totals.total_sales.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400 mb-1">Total</div>
              <div className="text-sm text-gray-400">Vendas serviços</div>
              <div className="text-xl font-bold text-green-400">
                R$ {totals.total_services_sold.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400 mb-1">Comissões</div>
              <div className="text-sm text-gray-400">Assinaturas</div>
              <div className="text-xl font-bold text-cyan-400">
                R$ {totals.total_signatures_commission.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400 mb-1">Comissões</div>
              <div className="text-sm text-gray-400">Pagas</div>
              <div className="text-xl font-bold text-orange-400">
                R$ {totals.total_commissions_paid.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400 mb-1">Comissões</div>
              <div className="text-sm text-gray-400">Pendentes</div>
              <div className="text-xl font-bold text-red-400">
                R$ {totals.total_pending_commissions.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Sales</div>
              <div className="text-sm text-gray-400">Total</div>
              <div className="text-2xl font-bold">
                {collaborators.reduce((sum, c) => sum + c.total_appointments, 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Sales</div>
              <div className="text-sm text-gray-400">Finished</div>
              <div className="text-2xl font-bold">
                {collaborators.reduce((sum, c) => sum + c.finished_appointments, 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Comissões</div>
              <div className="text-sm text-gray-400">Total</div>
              <div className="text-xl font-bold text-orange-400">
                R$ {totals.total_commissions.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second row of summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Vendas</div>
              <div className="text-sm text-gray-400">Vendas produto</div>
              <div className="text-xl font-bold text-green-400">
                R$ {totals.total_products_sold.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Comissões</div>
              <div className="text-sm text-gray-400">Normais</div>
              <div className="text-xl font-bold text-cyan-400">
                R$ {totals.total_services_sold.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Commissions</div>
              <div className="text-sm text-gray-400">Total</div>
              <div className="text-xl font-bold text-orange-400">
                R$ {totals.total_commissions.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Total em</div>
              <div className="text-sm text-gray-400">Extras</div>
              <div className="text-xl font-bold">R$ 0,00</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Compras de</div>
              <div className="text-sm text-gray-400">Produto</div>
              <div className="text-xl font-bold text-red-400">R$ 0,00</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Total em</div>
              <div className="text-sm text-gray-400">Vales</div>
              <div className="text-xl font-bold text-red-400">
                R$ {totals.total_vales.toFixed(2).replace('.', ',')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400">Comissões</div>
              <div className="text-sm text-gray-400">Pagas</div>
              <div className="text-xl font-bold">R$ 0,00</div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-4 lg:col-span-1 bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Commission breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commissionBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {commissionBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Start</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">End</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
        <Button 
          onClick={fetchCollaboratorsReport}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
        >
          <Search className="h-4 w-4 mr-2" />
          Pesquisar
        </Button>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[250px] bg-gray-800 border-gray-700">
            <SelectValue placeholder="COLLABORATOR_TYPE: All" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">All</SelectItem>
            {collaborators.map(c => (
              <SelectItem key={c.technician_id} value={c.technician_id}>
                {c.technician_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline"
          className="bg-gray-800 border-gray-700 hover:bg-gray-700"
        >
          <Eye className="h-4 w-4 mr-2" />
          Adicionar lançamento para o barbeiro
        </Button>
      </div>

      {/* Collaborators Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/50">
                <TableHead className="text-gray-300 w-[250px]">COLLABORATOR</TableHead>
                <TableHead className="text-gray-300 text-right">SALES TOTAL</TableHead>
                <TableHead className="text-gray-300 text-right">COMMISSION'S SERVICES</TableHead>
                <TableHead className="text-gray-300 text-right">COMMISSION'S PRODUCTS</TableHead>
                <TableHead className="text-gray-300 text-right">COMISSÃO ASSINATURA</TableHead>
                <TableHead className="text-gray-300 text-right">TOTAL EM EXTRAS</TableHead>
                <TableHead className="text-gray-300 text-right">COMPRAS DE PRODUTO</TableHead>
                <TableHead className="text-gray-300 text-right">TOTAL EM VALES</TableHead>
                <TableHead className="text-gray-300 text-right">COMISSÕES PAGAS</TableHead>
                <TableHead className="text-gray-300 text-right">COMISSÕES PENDENTES</TableHead>
                <TableHead className="text-gray-300 text-right">TOTAL DE PONTOS</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center text-gray-400">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredCollaborators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center text-gray-400">
                    Nenhum colaborador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredCollaborators.map((collab) => (
                  <TableRow 
                    key={collab.technician_id} 
                    className="border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => setSelectedCollaborator(collab.technician_id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10" style={{ borderColor: collab.color || '#6B7280', borderWidth: 2 }}>
                          <AvatarImage src={collab.avatar_url || undefined} />
                          <AvatarFallback style={{ backgroundColor: collab.color || '#6B7280' }}>
                            {collab.technician_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{collab.technician_name}</div>
                          <div className="text-xs text-gray-400">
                            {collab.total_appointments} agendamentos
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {collab.total_sales.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right text-cyan-400">
                      R$ {collab.commission_services.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right text-green-400">
                      R$ {collab.commission_products.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right text-blue-400">
                      R$ {collab.commission_signatures.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {collab.total_extras.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right text-red-400">
                      R$ {collab.product_purchases.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right text-red-400">
                      R$ {collab.total_vales.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {collab.commission_paid.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right text-yellow-400 font-semibold">
                      R$ {collab.pending_commissions.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {collab.points_total}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaboratorsReport;
