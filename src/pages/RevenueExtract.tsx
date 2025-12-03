"use client";

import React, { useState, useEffect } from 'react';
import { Receipt, ChevronLeft, ChevronRight, Download, Search, Info, TrendingUp, Calendar, DollarSign, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  sale_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  status: string;
  taxes?: number;
  net_amount?: number;
  service_package_sales: {
    clients: { first_name: string; last_name: string } | null;
    service_packages: { name: string } | null;
  } | null;
}

const RevenueExtract = () => {
  const { user } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filterBy, setFilterBy] = useState<'billing' | 'payment'>('payment');
  const [filterAll, setFilterAll] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;

      setLoading(true);

      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      // Mock data for demonstration
      const mockPayments: Payment[] = [
        {
          id: '1',
          sale_id: 'sale1',
          payment_date: '2025-11-24',
          amount: 99.90,
          payment_method: 'Pagamento no Crédito',
          status: 'Previsto para 26/12/2025',
          taxes: 3.98,
          net_amount: 95.92,
          service_package_sales: {
            clients: { first_name: 'Heitor Terencio', last_name: 'Ferreira Leonel' },
            service_packages: { name: 'Assinatura - Plano Prata' }
          }
        },
        {
          id: '2',
          sale_id: 'sale2',
          payment_date: '2025-11-24',
          amount: 159.90,
          payment_method: 'Pagamento no Crédito',
          status: 'Previsto para 26/12/2025',
          taxes: 6.08,
          net_amount: 153.82,
          service_package_sales: {
            clients: { first_name: 'Peterson', last_name: 'Lima' },
            service_packages: { name: 'Assinatura - Diamante OAB' }
          }
        },
        {
          id: '3',
          sale_id: 'sale3',
          payment_date: '2025-11-24',
          amount: 99.90,
          payment_method: 'Pagamento no Crédito',
          status: 'Previsto para 26/12/2025',
          taxes: 3.98,
          net_amount: 95.92,
          service_package_sales: {
            clients: { first_name: 'Gustavo Machado', last_name: 'Diniz Teles' },
            service_packages: { name: 'Assinatura - Plano Prata' }
          }
        }
      ];

      setPayments(mockPayments);
      setLoading(false);
    };

    fetchPayments();
  }, [user, selectedMonth]);

  const handlePreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const filteredPayments = payments.filter(payment => {
    const clientName = payment.service_package_sales?.clients 
      ? `${payment.service_package_sales.clients.first_name} ${payment.service_package_sales.clients.last_name}`.toLowerCase()
      : '';
    return clientName.includes(searchTerm.toLowerCase());
  });

  const totalGross = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalTaxes = filteredPayments.reduce((sum, payment) => sum + (payment.taxes || 0), 0);
  const totalNet = filteredPayments.reduce((sum, payment) => sum + (payment.net_amount || payment.amount), 0);
  const receivedExternal = filteredPayments.filter(p => p.payment_method.includes('externamente')).reduce((sum, p) => sum + p.amount, 0);
  const averageTicket = filteredPayments.length > 0 ? totalGross / filteredPayments.length : 0;
  const uniqueClients = new Set(filteredPayments.map(p => p.service_package_sales?.clients?.first_name + ' ' + p.service_package_sales?.clients?.last_name)).size;

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Extrato de recebimentos de assinaturas</h1>
        <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold">
          <Download className="h-4 w-4 mr-2" />
          Exportar em Excel
        </Button>
      </div>

      {/* Description */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm">
          Este relatório utiliza a data de pagamento das faturas como critério de análise, ou seja, verifica todas as faturas que foram pagas dentro período, independente da 
          data de vencimento dessas faturas. Caso precise verificar a previsão de recebimentos de acordo com a data de vencimento das faturas, utilize o relatório de 
          "Previsão de pagamentos"
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-gray-800 border border-blue-500/30 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-blue-400 text-3xl font-bold mb-1">R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs">Total bruto faturado</p>
          <p className="text-gray-500 text-[10px] mt-1">Faturas pagas na Asaas + Recebidos externamente</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-gray-100 text-3xl font-bold mb-1">R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs">Ticket médio</p>
          <p className="text-gray-500 text-[10px] mt-1">{uniqueClients} clientes distintos pagantes</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-gray-100 text-3xl font-bold mb-1">R$ {receivedExternal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs">Recebidos externamente</p>
          <p className="text-gray-500 text-[10px] mt-1">Faturas consideradas como recebidas na barbearia</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-gray-100 text-3xl font-bold mb-1">R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs">Valor Bruto</p>
          <p className="text-gray-500 text-[10px] mt-1">Faturas pagas pelos clientes através da Asaas</p>
        </div>

        <div className="bg-gray-800 border border-red-500/30 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-red-400 text-3xl font-bold mb-1">R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs">Descontos</p>
          <p className="text-gray-500 text-[10px] mt-1">Taxas das faturas pagas pelos clientes na Asaas</p>
        </div>

        <div className="bg-gray-800 border border-green-500/30 rounded-xl p-4 relative">
          <Info className="h-4 w-4 text-gray-400 absolute top-4 right-4" />
          <p className="text-green-400 text-3xl font-bold mb-1">R$ {totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-xs">Valor Líquido</p>
          <p className="text-gray-500 text-[10px] mt-1">Faturas pagas na Asaas menos os descontos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-400">Start</span>
            <Input
              type="date"
              value={format(startOfMonth(selectedMonth), 'yyyy-MM-dd')}
              className="bg-transparent border-none text-sm w-32"
              readOnly
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-400">End</span>
            <Input
              type="date"
              value={format(endOfMonth(selectedMonth), 'yyyy-MM-dd')}
              className="bg-transparent border-none text-sm w-32"
              readOnly
            />
          </div>
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold">
            <Search className="h-4 w-4 mr-2" />
            Pesquisar
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Analisar por:</span>
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="billing">Data de faturamento</SelectItem>
                <SelectItem value="payment">Data de pagamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Filtrar por:</span>
            <Select value={filterAll} onValueChange={setFilterAll}>
              <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-gray-400">
          <div className="col-span-2">PAGAMENTO</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-4">DESCRIPTION</div>
          <div className="col-span-1 text-right">VALOR BRUTO</div>
          <div className="col-span-1 text-right">TAXAS</div>
          <div className="col-span-2 text-right">VALOR LIQUIDO</div>
        </div>
      </div>

      {/* Table Content */}
      <div className="space-y-0">
        {loading ? (
          <div className="bg-gray-800 border border-gray-700 rounded-b-lg p-12 text-center">
            <p className="text-gray-400">Carregando pagamentos...</p>
          </div>
        ) : filteredPayments.length > 0 ? (
          filteredPayments.map((payment, index) => (
            <div
              key={payment.id}
              className={cn(
                "bg-gray-800 border-x border-b border-gray-700 hover:bg-gray-750 transition-colors",
                index === filteredPayments.length - 1 && "rounded-b-lg"
              )}
            >
              <div className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer">
                <div className="col-span-2">
                  <p className="text-sm font-medium">
                    {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                  </p>
                </div>

                <div className="col-span-2">
                  <div>
                    <p className="text-sm font-medium">{payment.payment_method}</p>
                    <p className="text-xs text-blue-400">{payment.status}</p>
                  </div>
                </div>

                <div className="col-span-4">
                  <div>
                    <p className="text-sm">
                      Cliente: {payment.service_package_sales?.clients 
                        ? `${payment.service_package_sales.clients.first_name} ${payment.service_package_sales.clients.last_name}`
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {payment.service_package_sales?.service_packages?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="col-span-1 text-right">
                  <p className="text-sm font-medium">R$ {payment.amount.toFixed(2).replace('.', ',')}</p>
                </div>

                <div className="col-span-1 text-right">
                  <p className="text-sm text-red-400">R$ {(payment.taxes || 0).toFixed(2).replace('.', ',')}</p>
                </div>

                <div className="col-span-2 text-right flex items-center justify-end gap-2">
                  <p className="text-sm font-semibold">R$ {(payment.net_amount || payment.amount).toFixed(2).replace('.', ',')}</p>
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-b-lg p-12 text-center">
            <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum pagamento encontrado para este período.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueExtract;
