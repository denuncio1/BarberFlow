"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Edit, Trash2, ChevronRight, Search, Filter, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SubscriptionPlanForm from '@/components/SubscriptionPlanForm';

interface Service {
  id: string;
  name: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  value: number;
  enabled_days: string[];
  services: Service[];
  usage_limit: boolean;
  visible_to_clients: boolean;
  service_time?: number;
  created_at: string;
}

const SubscriptionPlans: React.FC = () => {
  const { user } = useSession();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortPlans();
  }, [plans, searchTerm, statusFilter, sortBy]);

  const fetchPlans = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select(`
          id,
          name,
          value,
          service_time,
          type,
          service_quantity,
          created_at
        `)
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      // Buscar os serviços de cada pacote separadamente
      const formattedPlans = await Promise.all((data || []).map(async (plan) => {
        const { data: packageServices } = await supabase
          .from('service_package_services')
          .select(`
            service_id,
            services (
              id,
              name
            )
          `)
          .eq('service_package_id', plan.id);

        return {
          id: plan.id,
          name: plan.name,
          value: plan.value,
          enabled_days: [],
          services: packageServices?.map((sps: any) => ({
            id: sps.services.id,
            name: sps.services.name,
          })) || [],
          usage_limit: false,
          visible_to_clients: true,
          service_time: plan.service_time,
          created_at: plan.created_at,
        };
      }));

      setPlans(formattedPlans);
    } catch (error: any) {
      console.error('Erro ao buscar planos:', error);
      showError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPlans = () => {
    let filtered = [...plans];

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan => {
        if (statusFilter === 'active') return plan.visible_to_clients;
        if (statusFilter === 'inactive') return !plan.visible_to_clients;
        return true;
      });
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.value.toString().includes(searchTerm)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'value-asc':
          return a.value - b.value;
        case 'value-desc':
          return b.value - a.value;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredPlans(filtered);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      const { error } = await supabase
        .from('service_packages')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      showSuccess('Plano excluído com sucesso!');
      fetchPlans();
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error);
      showError('Erro ao excluir plano: ' + error.message);
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
    fetchPlans();
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const formatDays = (days: string[]) => {
    const dayMap: { [key: string]: string } = {
      'Monday': 'Seg',
      'Tuesday': 'Ter',
      'Wednesday': 'Qua',
      'Thursday': 'Qui',
      'Friday': 'Sex',
      'Saturday': 'Sáb',
      'Sunday': 'Dom'
    };
    return days.map(day => dayMap[day] || day).join(', ');
  };

  const handleDragStart = (e: React.DragEvent, planId: string) => {
    setDraggedItemId(planId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetPlanId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetPlanId) return;

    // Reordenar localmente para feedback imediato
    const draggedIndex = filteredPlans.findIndex(p => p.id === draggedItemId);
    const targetIndex = filteredPlans.findIndex(p => p.id === targetPlanId);
    
    const newPlans = [...filteredPlans];
    const [draggedItem] = newPlans.splice(draggedIndex, 1);
    newPlans.splice(targetIndex, 0, draggedItem);
    
    setFilteredPlans(newPlans);
    setDraggedItemId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-gray-400">Carregando planos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Planos de assinatura</h1>
            <p className="text-gray-400 mt-1">{filteredPlans.length} planos cadastrados</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar novo plano
            </Button>
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar em excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100 mb-1">Filtros de Busca</h2>
            <p className="text-sm text-gray-400">Encontre planos por status, valor ou nome</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">Todos os planos</SelectItem>
                    <SelectItem value="active">Visíveis para clientes</SelectItem>
                    <SelectItem value="inactive">Ocultos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
            <div className="col-span-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="name">Nome (A-Z)</SelectItem>
                  <SelectItem value="value-asc">Valor (menor)</SelectItem>
                  <SelectItem value="value-desc">Valor (maior)</SelectItem>
                  <SelectItem value="newest">Mais recente</SelectItem>
                  <SelectItem value="oldest">Mais antigo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquise por nome ou valor"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="col-span-1 flex items-center justify-end">
              <Button
                variant="outline"
                size="icon"
                className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhum plano encontrado</h3>
            <p className="text-gray-500">Cadastre seu primeiro plano de assinatura</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header da tabela */}
            <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b border-gray-700">
              <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase">Ordenar</div>
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase">Nome</div>
              <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase">Valor</div>
              <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase">Dias habilitados</div>
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase">Serviços</div>
              <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase text-center">Limite de uso</div>
              <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase text-center">Visível p/ clientes</div>
              <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase text-right">Ações</div>
            </div>

            {/* Planos */}
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                draggable
                onDragStart={(e) => handleDragStart(e, plan.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, plan.id)}
                className={`
                  grid grid-cols-12 gap-4 items-center p-4 bg-gray-800 rounded-lg border border-gray-700
                  hover:bg-gray-750 transition-all cursor-move
                  ${draggedItemId === plan.id ? 'opacity-50' : ''}
                `}
              >
                {/* Drag Handle */}
                <div className="col-span-1 flex flex-col items-center justify-center space-y-1">
                  <div className="w-6 h-6 flex items-center justify-center text-yellow-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-500">
                      <path d="M7 10L12 5L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 14L12 19L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Nome */}
                <div className="col-span-2">
                  <div className="text-gray-100 font-semibold">{plan.name}</div>
                </div>

                {/* Valor */}
                <div className="col-span-1">
                  <div className="text-green-400 font-bold">
                    R$ {plan.value.toFixed(2).replace('.', ',')}
                  </div>
                </div>

                {/* Dias Habilitados */}
                <div className="col-span-3">
                  <div className="text-gray-300 text-sm">
                    {plan.enabled_days.length > 0 ? formatDays(plan.enabled_days) : 'Todos os dias'}
                  </div>
                </div>

                {/* Serviços */}
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {plan.services.length > 0 ? (
                      plan.services.slice(0, 2).map((service) => (
                        <Badge key={service.id} variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs">
                          {service.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-xs">Nenhum serviço</span>
                    )}
                    {plan.services.length > 2 && (
                      <Badge variant="outline" className="bg-gray-700 border-gray-600 text-gray-400 text-xs">
                        +{plan.services.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Limite de uso */}
                <div className="col-span-1 flex justify-center">
                  <Badge variant={plan.usage_limit ? "default" : "secondary"} className={plan.usage_limit ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-gray-700 text-gray-400"}>
                    {plan.usage_limit ? 'Sim' : 'Não'}
                  </Badge>
                </div>

                {/* Visível */}
                <div className="col-span-1 flex justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plan.visible_to_clients}
                      onChange={async () => {
                        try {
                          await supabase
                            .from('service_packages')
                            .update({ visible_to_clients: !plan.visible_to_clients })
                            .eq('id', plan.id);
                          fetchPlans();
                        } catch (error) {
                          showError('Erro ao atualizar visibilidade');
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>

                {/* Ações */}
                <div className="col-span-1 flex items-center justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(plan)}
                    className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(plan.id)}
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 hover:text-gray-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-gray-100 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-100">
              {editingPlan ? 'Editar plano' : 'Cadastrar novo plano'}
            </DialogTitle>
          </DialogHeader>
          <SubscriptionPlanForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            initialData={editingPlan}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlans;
