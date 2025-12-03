import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, Target, Award, Calendar, DollarSign, Package, Scissors, Eye } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import TeamGoalForm from '../components/TeamGoalForm';

interface Technician {
  id: string;
  name: string;
  avatar_url: string | null;
  color: string | null;
}

interface Goal {
  id: string;
  technician_id: string;
  goal_type: 'products' | 'services_unsigned' | 'services_signed' | 'general_unsigned' | 'general_signed';
  goal_value: number;
  min_expected_value: number;
  max_expected_value: number;
  bonus_active: boolean;
  consider_signature: boolean;
  month: number;
  year: number;
  created_at: string;
  technicians?: Technician;
}

interface GoalProgress {
  goal: Goal;
  current_value: number;
  progress_percentage: number;
  status: 'below_min' | 'between' | 'above_max';
}

const TeamGoals = () => {
  const { session, isLoading, user } = useSession();
  const { t } = useTranslation();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsProgress, setGoalsProgress] = useState<GoalProgress[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchTechnicians();
      fetchGoals();
    }
  }, [user, selectedMonth, selectedYear]);

  const fetchTechnicians = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('id, name, avatar_url, color')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar colaboradores:", error);
      showError("Erro ao carregar colaboradores: " + error.message);
    }
  };

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('team_goals')
        .select(`
          *,
          technicians:technician_id (
            id,
            name,
            avatar_url,
            color
          )
        `)
        .eq('user_id', user.id)
        .eq('month', selectedMonth)
        .eq('year', selectedYear);

      if (goalsError) throw goalsError;

      const typedGoals: Goal[] = (goalsData || []).map((item: any) => ({
        ...item,
        technicians: Array.isArray(item.technicians) ? item.technicians[0] : item.technicians,
      }));

      setGoals(typedGoals);

      // Calculate progress for each goal
      const progressPromises = typedGoals.map(async (goal) => {
        const currentValue = await calculateGoalProgress(goal);
        const progress_percentage = goal.max_expected_value > 0 
          ? (currentValue / goal.max_expected_value) * 100 
          : 0;
        
        let status: 'below_min' | 'between' | 'above_max' = 'below_min';
        if (currentValue >= goal.max_expected_value) {
          status = 'above_max';
        } else if (currentValue >= goal.min_expected_value) {
          status = 'between';
        }

        return {
          goal,
          current_value: currentValue,
          progress_percentage: Math.min(progress_percentage, 100),
          status,
        };
      });

      const progress = await Promise.all(progressPromises);
      setGoalsProgress(progress);
    } catch (error: any) {
      console.error("Erro ao buscar metas:", error);
      showError("Erro ao carregar metas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateGoalProgress = async (goal: Goal): Promise<number> => {
    if (!user) return 0;

    const startDate = new Date(goal.year, goal.month - 1, 1);
    const endDate = endOfMonth(startDate);

    try {
      let query = supabase
        .from('appointments')
        .select('signature_used, service_id')
        .eq('user_id', user.id)
        .eq('technician_id', goal.technician_id)
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString())
        .in('status', ['completed', 'confirmed']);

      // Filter by goal type
      if (goal.goal_type === 'products') {
        // Would need to check appointment_products table
        return 0; // Placeholder
      } else if (goal.goal_type === 'services_unsigned') {
        query = query.eq('signature_used', false);
      } else if (goal.goal_type === 'services_signed') {
        query = query.eq('signature_used', true);
      } else if (goal.goal_type === 'general_unsigned') {
        query = query.eq('signature_used', false);
      } else if (goal.goal_type === 'general_signed') {
        query = query.eq('signature_used', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch service prices
      const serviceIds = (data || []).map((apt: any) => apt.service_id).filter(Boolean);
      if (serviceIds.length === 0) return 0;

      const { data: servicesData } = await supabase
        .from('services')
        .select('id, price')
        .in('id', serviceIds);

      const servicePrices = (servicesData || []).reduce((acc: Record<string, number>, service: any) => {
        acc[service.id] = service.price || 0;
        return acc;
      }, {});

      // Calculate total from service prices
      return (data || []).reduce((sum: number, apt: any) => {
        const servicePrice = servicePrices[apt.service_id] || 0;
        return sum + servicePrice;
      }, 0);
    } catch (error) {
      console.error("Erro ao calcular progresso:", error);
      return 0;
    }
  };

  const handleGoalAdded = () => {
    setIsAddGoalDialogOpen(false);
    fetchGoals();
    showSuccess("Meta adicionada com sucesso!");
  };

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'products': 'Metas por produtos',
      'services_unsigned': 'Metas por serviços - Sem assinatura',
      'services_signed': 'Metas por serviços - Com assinatura',
      'general_unsigned': 'Metas gerais - Sem assinatura',
      'general_signed': 'Metas gerais - Com assinatura',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'above_max') {
      return <Badge className="bg-green-500">Acima da Meta Máxima</Badge>;
    } else if (status === 'between') {
      return <Badge className="bg-yellow-500">Entre Mínima e Máxima</Badge>;
    } else {
      return <Badge className="bg-red-500">Abaixo da Meta Mínima</Badge>;
    }
  };

  const chartData = goalsProgress.map(gp => ({
    name: gp.goal.technicians?.name || 'N/A',
    atual: gp.current_value,
    minima: gp.goal.min_expected_value,
    maxima: gp.goal.max_expected_value,
  }));

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Metas da Equipe</h1>
          <p className="text-gray-400">Gerencie e acompanhe as metas de desempenho da equipe</p>
        </div>
        <Dialog open={isAddGoalDialogOpen} onOpenChange={setIsAddGoalDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
              <Plus className="h-4 w-4 mr-2" /> Criar nova meta para colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-gray-800 text-gray-100 border-gray-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-100 text-xl">Nova Meta de Colaborador</DialogTitle>
            </DialogHeader>
            <TeamGoalForm 
              onSuccess={handleGoalAdded} 
              onCancel={() => setIsAddGoalDialogOpen(false)}
              technicians={technicians}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>
                  {format(new Date(2025, month - 1), 'MMMM', { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select 
          value={selectedYear.toString()} 
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {[2024, 2025, 2026].map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={fetchGoals}
          className="bg-gray-800 border-gray-700 hover:bg-gray-700"
        >
          Atualizar
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview">Metas dos colaboradores</TabsTrigger>
          <TabsTrigger value="products">Metas por produtos</TabsTrigger>
          <TabsTrigger value="services_unsigned">Metas por serviços - Sem assinatura</TabsTrigger>
          <TabsTrigger value="services_signed">Metas por serviços - Com assinatura</TabsTrigger>
          <TabsTrigger value="general_unsigned">Metas gerais - Sem assinatura</TabsTrigger>
          <TabsTrigger value="general_signed">Metas gerais - Com assinatura</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Carregando metas...</p>
            </div>
          ) : goalsProgress.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-12 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma meta cadastrada</h3>
                <p className="text-gray-400 mb-6">Comece criando metas para seus colaboradores</p>
                <Button 
                  onClick={() => setIsAddGoalDialogOpen(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                >
                  <Plus className="h-4 w-4 mr-2" /> Criar primeira meta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Progresso Geral
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend />
                        <Bar dataKey="atual" fill="#10B981" name="Atual" />
                        <Bar dataKey="minima" fill="#F59E0B" name="Meta Mínima" />
                        <Bar dataKey="maxima" fill="#3B82F6" name="Meta Máxima" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {goalsProgress
                        .sort((a, b) => b.progress_percentage - a.progress_percentage)
                        .slice(0, 5)
                        .map((gp, index) => (
                          <div key={gp.goal.id} className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{gp.goal.technicians?.name}</p>
                              <Progress value={gp.progress_percentage} className="h-2 mt-1" />
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{gp.progress_percentage.toFixed(1)}%</p>
                              <p className="text-sm text-gray-400">
                                R$ {gp.current_value.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Detalhamento por Colaborador</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-gray-700/50">
                        <TableHead className="text-gray-300">COLABORADOR</TableHead>
                        <TableHead className="text-gray-300">TIPO DA META</TableHead>
                        <TableHead className="text-gray-300">SALES TOTAL</TableHead>
                        <TableHead className="text-gray-300">META MÍNIMA PREVISTA</TableHead>
                        <TableHead className="text-gray-300">META MÁXIMA PREVISTA</TableHead>
                        <TableHead className="text-gray-300">PROGRESSO</TableHead>
                        <TableHead className="text-gray-300">STATUS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goalsProgress.map((gp) => (
                        <TableRow key={gp.goal.id} className="border-gray-700 hover:bg-gray-700/50">
                          <TableCell className="font-semibold">
                            {gp.goal.technicians?.name || 'N/A'}
                          </TableCell>
                          <TableCell>{getGoalTypeLabel(gp.goal.goal_type)}</TableCell>
                          <TableCell>
                            <span className="font-bold text-green-400">
                              R$ {gp.current_value.toFixed(2).replace('.', ',')}
                            </span>
                          </TableCell>
                          <TableCell>
                            R$ {gp.goal.min_expected_value.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell>
                            R$ {gp.goal.max_expected_value.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={gp.progress_percentage} className="h-2" />
                              <p className="text-xs text-gray-400">
                                {gp.progress_percentage.toFixed(1)}%
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(gp.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {['products', 'services_unsigned', 'services_signed', 'general_unsigned', 'general_signed'].map(type => (
          <TabsContent key={type} value={type}>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>{getGoalTypeLabel(type)}</CardTitle>
              </CardHeader>
              <CardContent>
                {goalsProgress.filter(gp => gp.goal.goal_type === type).length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">Nenhuma meta cadastrada para esta categoria</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-gray-700/50">
                        <TableHead className="text-gray-300">COLABORADOR</TableHead>
                        <TableHead className="text-gray-300">SALES TOTAL</TableHead>
                        <TableHead className="text-gray-300">META MÍNIMA PREVISTA</TableHead>
                        <TableHead className="text-gray-300">META MÁXIMA PREVISTA</TableHead>
                        <TableHead className="text-gray-300">BÔNUS ATIVO</TableHead>
                        <TableHead className="text-gray-300">CONSIDERAR ASSINATURA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goalsProgress
                        .filter(gp => gp.goal.goal_type === type)
                        .map((gp) => (
                          <TableRow key={gp.goal.id} className="border-gray-700 hover:bg-gray-700/50">
                            <TableCell className="font-semibold">
                              {gp.goal.technicians?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-green-400">
                                R$ {gp.current_value.toFixed(2).replace('.', ',')}
                              </span>
                            </TableCell>
                            <TableCell>
                              R$ {gp.goal.min_expected_value.toFixed(2).replace('.', ',')}
                            </TableCell>
                            <TableCell>
                              R$ {gp.goal.max_expected_value.toFixed(2).replace('.', ',')}
                            </TableCell>
                            <TableCell>
                              {gp.goal.bonus_active ? (
                                <Badge className="bg-green-500">Sim</Badge>
                              ) : (
                                <Badge className="bg-gray-600">Não</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {gp.goal.consider_signature ? (
                                <Badge className="bg-blue-500">Sim</Badge>
                              ) : (
                                <Badge className="bg-gray-600">Não</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TeamGoals;
