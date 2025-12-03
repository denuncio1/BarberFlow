"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import ServicePackageSaleForm from '@/components/ServicePackageSaleForm';

interface ServicePackageSale {
  id: string;
  client_id: string;
  service_package_id: string;
  price: number;
  purchased_quantity: number;
  remaining_quantity: number;
  clients?: {
    name: string;
  };
  service_packages?: {
    name: string;
  };
}

const ServicePackageSales = () => {
  const { t } = useTranslation();
  const { user } = useSession();
  const [sales, setSales] = useState<ServicePackageSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<ServicePackageSale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<ServicePackageSale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSales(sales);
    } else {
      const filtered = sales.filter(sale =>
        sale.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSales(filtered);
    }
  }, [searchTerm, sales]);

  const fetchSales = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_package_sales')
        .select(`
          *,
          clients (id, first_name, last_name),
          service_packages (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear dados para incluir nome completo do cliente
      const salesWithFullName = (data || []).map(sale => ({
        ...sale,
        clients: sale.clients ? {
          ...sale.clients,
          name: `${sale.clients.first_name} ${sale.clients.last_name}`.trim()
        } : null
      }));
      
      setSales(salesWithFullName);
      setFilteredSales(salesWithFullName);
    } catch (error: any) {
      console.error('Erro ao buscar vendas:', error);
      showError('Erro ao carregar vendas de pacotes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleClick = (sale: ServicePackageSale) => {
    setEditingSale(sale);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchSales();
    setIsDialogOpen(false);
    setEditingSale(null);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingSale(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Venda de pacotes de serviços
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              onClick={() => setEditingSale(null)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar venda de pacote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-gray-800 text-gray-100 border-gray-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-100">
                {editingSale ? 'Editar Venda de Pacote' : 'Cadastrar Venda de Pacote'}
              </DialogTitle>
            </DialogHeader>
            <ServicePackageSaleForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              editingSale={editingSale}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500" />
        <Input
          placeholder="Filtrar pelo nome do cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
        />
      </div>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-800">
            <TableRow>
              <TableHead className="text-gray-300 uppercase text-xs">Cliente</TableHead>
              <TableHead className="text-gray-300 uppercase text-xs">Pacote de Serviço</TableHead>
              <TableHead className="text-gray-300 uppercase text-xs">Price</TableHead>
              <TableHead className="text-gray-300 uppercase text-xs">Quantidade Contratada</TableHead>
              <TableHead className="text-gray-300 uppercase text-xs">Quantidade Restante</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  {searchTerm ? 'Nenhuma venda encontrada.' : 'Nenhuma venda cadastrada.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => handleSaleClick(sale)}
                >
                  <TableCell className="font-semibold text-gray-100">
                    {sale.clients?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {sale.service_packages?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-300">{formatCurrency(sale.price)}</TableCell>
                  <TableCell className="text-gray-300">{sale.purchased_quantity}</TableCell>
                  <TableCell className="text-gray-300">{sale.remaining_quantity}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServicePackageSales;
