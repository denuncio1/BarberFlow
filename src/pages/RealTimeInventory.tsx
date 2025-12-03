"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';

interface InventoryItem {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  category: string;
  cost_price: number;
  total_value: number;
}

const RealTimeInventory = () => {
  const { session, isLoading } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchInventory();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('inventory-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            fetchInventory();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('name');

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        stock_quantity: item.stock_quantity || 0,
        min_stock: item.min_stock || 0,
        unit: item.unit || 'UN',
        category: item.category || 'Sem categoria',
        cost_price: item.cost_price || 0,
        total_value: (item.stock_quantity || 0) * (item.cost_price || 0),
      })) || [];

      setInventory(formattedData);
    } catch (error: any) {
      showError('Erro ao buscar inventário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.total_value, 0);
  const lowStockItems = inventory.filter((item) => item.stock_quantity <= item.min_stock);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) {
      return { label: 'SEM ESTOQUE', color: 'bg-red-600' };
    } else if (current <= min) {
      return { label: 'ESTOQUE BAIXO', color: 'bg-yellow-600' };
    } else {
      return { label: 'NORMAL', color: 'bg-green-600' };
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100">Inventário em Tempo Real</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm">Valor Total do Estoque</p>
          <p className="text-2xl font-bold text-gray-100">{formatCurrency(totalInventoryValue)}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm">Total de Produtos</p>
          <p className="text-2xl font-bold text-gray-100">{inventory.length}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Produtos em Estoque Baixo
          </p>
          <p className="text-2xl font-bold text-yellow-500">{lowStockItems.length}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-gray-800 p-4 rounded-lg">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Filtrar por nome ou categoria"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-700 border-gray-600 text-gray-100"
        />
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-700 hover:bg-gray-700">
              <TableHead className="text-gray-100 font-bold">PRODUTO</TableHead>
              <TableHead className="text-gray-100 font-bold">CATEGORIA</TableHead>
              <TableHead className="text-gray-100 font-bold">QTD ATUAL</TableHead>
              <TableHead className="text-gray-100 font-bold">QTD MÍNIMA</TableHead>
              <TableHead className="text-gray-100 font-bold">STATUS</TableHead>
              <TableHead className="text-gray-100 font-bold">CUSTO UNIT.</TableHead>
              <TableHead className="text-gray-100 font-bold">VALOR TOTAL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  Carregando inventário...
                </TableCell>
              </TableRow>
            ) : filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  {searchTerm ? 'Nenhum produto corresponde à sua pesquisa.' : 'Nenhum produto cadastrado.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
                const status = getStockStatus(item.stock_quantity, item.min_stock);
                return (
                  <TableRow key={item.id} className="hover:bg-gray-700 border-gray-700">
                    <TableCell className="text-gray-100 font-medium">{item.name}</TableCell>
                    <TableCell className="text-gray-100">{item.category}</TableCell>
                    <TableCell className="text-gray-100">
                      {item.stock_quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-gray-100">
                      {item.min_stock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-100">{formatCurrency(item.cost_price)}</TableCell>
                    <TableCell className="text-gray-100 font-semibold">
                      {formatCurrency(item.total_value)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="text-yellow-500 font-semibold mb-2">Atenção: Produtos com estoque baixo</h3>
              <ul className="text-gray-300 space-y-1">
                {lowStockItems.map((item) => (
                  <li key={item.id}>
                    • {item.name}: {item.stock_quantity} {item.unit} (Mínimo: {item.min_stock} {item.unit})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeInventory;
