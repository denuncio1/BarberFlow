"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, ChevronRight, Filter, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import SubscriptionForm from '@/components/SubscriptionForm';

interface Subscription {
  id: string;
  client_id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  next_billing_date: string;
  status: string;
  clients: { 
    first_name: string; 
    last_name: string; 
    phone?: string;
    id?: string;
  } | null;
  service_packages: { 
    name: string; 
    value: number;
    id?: string;
  } | null;
}

const SubscriptionManagement = () => {
  const { user } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'canceled'>('active');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [user, statusFilter]);

  const fetchSubscriptions = async () => {
    if (!user) return;

    setLoading(true);

    let query = supabase
      .from('service_package_sales')
      .select(`
        id,
        client_id,
        service_package_id,
        price,
        purchased_quantity,
        remaining_quantity,
        created_at
      `)
      .eq('user_id', user.id);

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        query = query.gt('remaining_quantity', 0);
      } else if (statusFilter === 'expired') {
        query = query.eq('remaining_quantity', 0);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar assinaturas:', error);
    } else {
      // Buscar dados relacionados separadamente
      const mappedData = await Promise.all((data || []).map(async (item: any) => {
        // Buscar cliente
        const { data: clientData } = await supabase
          .from('clients')
          .select('first_name, last_name, phone')
          .eq('id', item.client_id)
          .single();

        // Buscar pacote
        const { data: packageData } = await supabase
          .from('service_packages')
          .select('name, value')
          .eq('id', item.service_package_id)
          .single();

        const status = item.remaining_quantity > 0 ? 'active' : 'expired';

        return {
          ...item,
          package_id: item.service_package_id,
          start_date: item.created_at,
          end_date: null,
          next_billing_date: null,
          status: status,
          clients: clientData,
          service_packages: packageData,
        };
      }));
      
      setSubscriptions(mappedData);
    }

    setLoading(false);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta assinatura?')) return;

    const { error } = await supabase
      .from('service_package_sales')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir assinatura:', error);
    } else {
      fetchSubscriptions();
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingSubscription(null);
    fetchSubscriptions();
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingSubscription(null);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const fullName = sub.clients ? `${sub.clients.first_name} ${sub.clients.last_name}`.toLowerCase() : '';
    const phone = sub.clients?.phone || '';
    return fullName.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      expired: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      canceled: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    
    const labels = {
      active: 'Ativo',
      expired: 'Vencido',
      canceled: 'Cancelado'
    };

    return (
      <span className={cn('px-3 py-1 rounded-full text-xs font-semibold border', styles[status as keyof typeof styles] || styles.active)}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Todas as assinaturas do Clube</h1>
        <div className="flex gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
                onClick={() => setEditingSubscription(null)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar nova assinatura
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-gray-100 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {editingSubscription ? 'Editar Assinatura' : 'Nova Assinatura'}
                </DialogTitle>
              </DialogHeader>
              <SubscriptionForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                initialData={editingSubscription}
              />
            </DialogContent>
          </Dialog>
          
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold border-2 border-yellow-500">
            <Download className="h-4 w-4 mr-2" />
            Exportar em excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="expired">Vencidos</SelectItem>
              <SelectItem value="canceled">Cancelados</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquise por nome, telefone ou email."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold">
            <Search className="h-4 w-4 mr-2" />
            Pesquisar
          </Button>
          <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-gray-400">
          <div className="col-span-3">CUSTOMER</div>
          <div className="col-span-2">PHONE</div>
          <div className="col-span-3">PLANO</div>
          <div className="col-span-2">VENCIMENTO</div>
          <div className="col-span-1">STATUS</div>
          <div className="col-span-1 text-right">AÇÕES</div>
        </div>
      </div>

      {/* Table Content */}
      <div className="space-y-0">
        {loading ? (
          <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-lg p-12 text-center">
            <p className="text-gray-400">Carregando assinaturas...</p>
          </div>
        ) : filteredSubscriptions.length > 0 ? (
          filteredSubscriptions.map((subscription, index) => (
            <div
              key={subscription.id}
              className={cn(
                "bg-gray-800 border-x border-b border-gray-700 hover:bg-gray-750 transition-colors",
                index === filteredSubscriptions.length - 1 && "rounded-b-lg"
              )}
            >
              <div className="grid grid-cols-12 gap-4 p-4 items-center">
                <div className="col-span-3">
                  <p className="text-sm font-medium">
                    {subscription.clients ? `${subscription.clients.first_name} ${subscription.clients.last_name}` : 'N/A'}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-yellow-500">
                    {subscription.clients?.phone || '-'}
                  </p>
                </div>

                <div className="col-span-3">
                  <p className="text-sm font-medium">{subscription.service_packages?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-400">
                    1ª Mensalidade: {subscription.start_date ? format(new Date(subscription.start_date), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm font-medium">
                    {subscription.end_date ? format(new Date(subscription.end_date), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>

                <div className="col-span-1">
                  {getStatusBadge(subscription.status)}
                </div>

                <div className="col-span-1 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                    onClick={() => handleEdit(subscription)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    onClick={() => handleDelete(subscription.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-lg p-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma assinatura encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
