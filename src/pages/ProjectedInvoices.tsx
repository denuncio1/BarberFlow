"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Info, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  client_id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  next_billing_date: string;
  status: string;
  subscription_status: string;
  clients: { first_name: string; last_name: string; phone?: string } | null;
  service_packages: { name: string; value: number } | null;
}

const ProjectedInvoices = () => {
  const { user } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [sortBy, setSortBy] = useState('due_date');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;

      setLoading(true);

      // Mock data for demonstration
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          client_id: 'c1',
          package_id: 'p1',
          start_date: '2025-09-01',
          end_date: '2025-11-01',
          next_billing_date: '2025-11-01',
          status: 'Cancelado',
          subscription_status: 'Cancelada',
          clients: { first_name: 'David Eduardo', last_name: 'de Oliveira', phone: '(11) 98765-4321' },
          service_packages: { name: 'Assinatura - Plano Gold', value: 129.90 }
        },
        {
          id: '2',
          client_id: 'c2',
          package_id: 'p2',
          start_date: '2025-08-01',
          end_date: '2025-11-01',
          next_billing_date: '2025-11-01',
          status: 'Pago no dia 01/11/2025',
          subscription_status: 'Cancelada',
          clients: { first_name: 'Leonardo Luiz', last_name: 'Machado', phone: '(11) 91234-5678' },
          service_packages: { name: 'Assinatura - Plano Prata', value: 99.90 }
        },
        {
          id: '3',
          client_id: 'c3',
          package_id: 'p3',
          start_date: '2025-07-01',
          end_date: '2025-11-30',
          next_billing_date: '2025-11-15',
          status: 'Aguardando pagamento',
          subscription_status: 'Ativa',
          clients: { first_name: 'Carlos', last_name: 'Silva', phone: '(11) 99876-5432' },
          service_packages: { name: 'Assinatura - Plano Diamante', value: 199.90 }
        },
        {
          id: '4',
          client_id: 'c4',
          package_id: 'p4',
          start_date: '2025-06-01',
          end_date: '2025-11-20',
          next_billing_date: '2025-11-20',
          status: 'Vencida',
          subscription_status: 'Vencida',
          clients: { first_name: 'Maria', last_name: 'Santos', phone: '(11) 98888-7777' },
          service_packages: { name: 'Assinatura - Plano Prata', value: 99.90 }
        },
        {
          id: '5',
          client_id: 'c5',
          package_id: 'p5',
          start_date: '2025-10-01',
          end_date: '2025-12-01',
          next_billing_date: '2025-11-25',
          status: 'Estornada',
          subscription_status: 'Estornada',
          clients: { first_name: 'João', last_name: 'Oliveira', phone: '(11) 97777-6666' },
          service_packages: { name: 'Assinatura - Plano Gold', value: 129.90 }
        }
      ];

      setInvoices(mockInvoices);
      setLoading(false);
    };

    fetchInvoices();
  }, [user, selectedMonth]);

  const handlePreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const paidInvoices = invoices.filter(i => i.status.includes('Pago'));
  const expiredInvoices = invoices.filter(i => i.status === 'Vencida' || i.subscription_status === 'Vencida');
  const awaitingPayment = invoices.filter(i => i.status === 'Aguardando pagamento');
  const canceledInvoices = invoices.filter(i => i.status === 'Cancelado' || i.subscription_status === 'Cancelada');
  const chargedBackInvoices = invoices.filter(i => i.status === 'Estornada');

  const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.service_packages?.value || 0), 0);
  const totalExpired = expiredInvoices.reduce((sum, i) => sum + (i.service_packages?.value || 0), 0);
  const totalAwaiting = awaitingPayment.reduce((sum, i) => sum + (i.service_packages?.value || 0), 0);
  const totalCanceled = canceledInvoices.reduce((sum, i) => sum + (i.service_packages?.value || 0), 0);
  const totalChargedBack = chargedBackInvoices.reduce((sum, i) => sum + (i.service_packages?.value || 0), 0);

  const getStatusColor = (status: string) => {
    if (status === 'Cancelado') return 'text-red-500';
    if (status.includes('Pago')) return 'text-green-500';
    if (status === 'Aguardando pagamento') return 'text-blue-500';
    if (status === 'Vencida') return 'text-orange-500';
    if (status === 'Estornada') return 'text-yellow-500';
    return 'text-gray-400';
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filterBy === 'all') return true;
    return invoice.status.toLowerCase().includes(filterBy.toLowerCase()) || 
           invoice.subscription_status.toLowerCase().includes(filterBy.toLowerCase());
  });

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-full">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-6">Previsão de pagamentos de faturas com base na data de vencimento</h1>

      {/* Description */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm">
          Este relatório utiliza a data de vencimento das faturas como critério de análise, ou seja, verifica todas as faturas que tem vencimento previsto para o período e 
          analisa se foram pagas dentro do prazo, se venceram, se formam canceladas ou estornadas. Caso precise verificar as faturas de acordo com a data de pagamento, 
          utilize o relatório de "Extrato de recebimentos"
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-800 border border-green-500/30 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-green-400 text-3xl font-bold mb-1">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs mb-1">{paidInvoices.length} faturas que tinham</p>
          <p className="text-gray-400 text-xs">vencimento para novembro estão pagas</p>
        </div>

        <div className="bg-gray-800 border border-orange-500/30 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-orange-400 text-3xl font-bold mb-1">R$ {totalExpired.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs mb-1">{expiredInvoices.length} faturas que tinham</p>
          <p className="text-gray-400 text-xs">vencimento para novembro estão vencidas</p>
        </div>

        <div className="bg-gray-800 border border-blue-500/30 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-blue-400 text-3xl font-bold mb-1">R$ {totalAwaiting.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs mb-1">{awaitingPayment.length} faturas que tinham</p>
          <p className="text-gray-400 text-xs">vencimento para novembro estão aguardando pagamento</p>
        </div>

        <div className="bg-gray-800 border border-red-500/30 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-red-400 text-3xl font-bold mb-1">R$ {totalCanceled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs mb-1">{canceledInvoices.length} faturas que tinham</p>
          <p className="text-gray-400 text-xs">vencimento para novembro estão canceladas</p>
        </div>

        <div className="bg-gray-800 border border-yellow-500/30 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-yellow-400 text-3xl font-bold mb-1">R$ {totalChargedBack.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs mb-1">{chargedBackInvoices.length} faturas que tinham</p>
          <p className="text-gray-400 text-xs">vencimento para novembro estão estornadas</p>
        </div>
      </div>

      {/* Filters and Month Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
          <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="font-medium min-w-[150px] text-center">
            {format(selectedMonth, 'MMMM \'de\' yyyy', { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Ordenar lista por:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="due_date">Data de vencimento</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="value">Valor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Filtrar por faturas:</span>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pago">Pagas</SelectItem>
                <SelectItem value="vencida">Vencidas</SelectItem>
                <SelectItem value="aguardando">Aguardando</SelectItem>
                <SelectItem value="cancelado">Canceladas</SelectItem>
                <SelectItem value="estornada">Estornadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="bg-gray-800 border-b border-gray-700 rounded-none w-full justify-start">
          <TabsTrigger 
            value="list" 
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 rounded-none data-[state=active]:text-yellow-500"
          >
            Faturas com vencimento em novembro
          </TabsTrigger>
          <TabsTrigger 
            value="summary" 
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 rounded-none text-gray-400"
          >
            Resumo por planos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          {/* Table Header */}
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-gray-400">
              <div className="col-span-2">VENCIMENTO</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-5">DESCRIPTION</div>
              <div className="col-span-2">CLIENTE</div>
              <div className="col-span-1 text-right">VALOR</div>
            </div>
          </div>

          {/* Table Content */}
          <div className="space-y-0">
            {loading ? (
              <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-lg p-12 text-center">
                <p className="text-gray-400">Carregando faturas...</p>
              </div>
            ) : filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice, index) => (
                <div
                  key={invoice.id}
                  className={cn(
                    "bg-gray-800 border-x border-b border-gray-700 hover:bg-gray-750 transition-colors",
                    index === filteredInvoices.length - 1 && "rounded-b-lg"
                  )}
                >
                  <div className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer">
                    <div className="col-span-2">
                      <p className="text-sm font-medium">
                        {format(new Date(invoice.next_billing_date), 'dd/MM/yyyy')}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <div>
                        <p className={cn("text-sm font-medium", getStatusColor(invoice.status))}>
                          {invoice.status}
                        </p>
                        {invoice.status.includes('Pago') && (
                          <p className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                            Link da fatura <ExternalLink className="h-3 w-3" />
                          </p>
                        )}
                        {invoice.status === 'Cancelado' && (
                          <p className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                            Link da fatura <ExternalLink className="h-3 w-3" />
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-5">
                      <p className="text-sm font-medium">{invoice.service_packages?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-400">Status da assinatura: {invoice.subscription_status}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-sm font-medium">
                        {invoice.clients ? `${invoice.clients.first_name} ${invoice.clients.last_name}` : 'N/A'}
                      </p>
                      <p className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                        Ver assinatura <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>

                    <div className="col-span-1 text-right">
                      <p className="text-sm font-semibold">
                        R$ {invoice.service_packages?.value.toFixed(2).replace('.', ',') || '0,00'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-lg p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhuma fatura prevista para este período.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400">Resumo por planos em desenvolvimento...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectedInvoices;
