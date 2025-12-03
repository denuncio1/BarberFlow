"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, ShoppingCart, Package, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AlertProduct {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  category: string;
  cost_price: number;
  last_purchase_date?: string;
  status: 'critical' | 'warning';
  days_until_out?: number;
}

const ReplenishmentAlerts = () => {
  const { session, isLoading } = useSession();
  const [alertProducts, setAlertProducts] = useState<AlertProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<AlertProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (session) {
      fetchAlerts();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('stock-alerts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            fetchAlerts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('stock_quantity', { ascending: true });

      if (error) throw error;

      // Filtrar apenas produtos com estoque baixo ou zerado
      const lowStockProducts: AlertProduct[] = data?.filter((item: any) => 
        item.stock_quantity <= (item.min_stock || 0)
      ).map((item: any) => ({
        id: item.id,
        name: item.name,
        stock_quantity: item.stock_quantity || 0,
        min_stock: item.min_stock || 0,
        unit: item.unit || 'UN',
        category: item.category || 'Sem categoria',
        cost_price: item.cost_price || 0,
        last_purchase_date: item.updated_at,
        status: (item.stock_quantity === 0 ? 'critical' : 'warning') as 'critical' | 'warning',
        days_until_out: item.stock_quantity === 0 ? 0 : Math.ceil(item.stock_quantity / 2), // Estimativa simples
      })) || [];

      setAlertProducts(lowStockProducts);
    } catch (error: any) {
      showError('Erro ao buscar alertas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alertProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalProducts = alertProducts.filter(p => p.status === 'critical');
  const warningProducts = alertProducts.filter(p => p.status === 'warning');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleCreatePurchaseOrder = (product: AlertProduct) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleMarkAsOrdered = async (productId: string) => {
    try {
      // Aqui você pode adicionar lógica para marcar como pedido realizado
      // Por enquanto, apenas mostra mensagem de sucesso
      showSuccess('Produto marcado como pedido realizado!');
    } catch (error: any) {
      showError('Erro ao marcar produto: ' + error.message);
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
        <h1 className="text-3xl font-bold text-gray-100">Alertas de Reposição</h1>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-900/20 border border-red-600 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-red-400 text-sm font-semibold">CRÍTICO - SEM ESTOQUE</p>
              <p className="text-3xl font-bold text-red-500">{criticalProducts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-yellow-400 text-sm font-semibold">ATENÇÃO - ESTOQUE BAIXO</p>
              <p className="text-3xl font-bold text-yellow-500">{warningProducts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-blue-400 text-sm font-semibold">TOTAL DE ALERTAS</p>
              <p className="text-3xl font-bold text-blue-500">{alertProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
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

      {/* Tabela de Alertas */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-700 hover:bg-gray-700">
              <TableHead className="text-gray-100 font-bold">STATUS</TableHead>
              <TableHead className="text-gray-100 font-bold">PRODUTO</TableHead>
              <TableHead className="text-gray-100 font-bold">CATEGORIA</TableHead>
              <TableHead className="text-gray-100 font-bold">ESTOQUE ATUAL</TableHead>
              <TableHead className="text-gray-100 font-bold">ESTOQUE MÍNIMO</TableHead>
              <TableHead className="text-gray-100 font-bold">CUSTO UNIT.</TableHead>
              <TableHead className="text-gray-100 font-bold">ÚLTIMA COMPRA</TableHead>
              <TableHead className="text-gray-100 font-bold">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  Carregando alertas...
                </TableCell>
              </TableRow>
            ) : filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <div>
                      <p className="text-gray-100 font-semibold">Nenhum alerta de reposição!</p>
                      <p className="text-gray-400 text-sm">
                        {searchTerm 
                          ? 'Nenhum produto corresponde à sua pesquisa.' 
                          : 'Todos os produtos estão com estoque adequado.'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((product) => (
                <TableRow 
                  key={product.id} 
                  className={`hover:bg-gray-700 border-gray-700 ${
                    product.status === 'critical' ? 'bg-red-900/10' : 'bg-yellow-900/10'
                  }`}
                >
                  <TableCell>
                    <Badge 
                      className={`${
                        product.status === 'critical' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-yellow-600 text-white'
                      }`}
                    >
                      {product.status === 'critical' ? (
                        <><AlertTriangle className="h-3 w-3 mr-1" /> CRÍTICO</>
                      ) : (
                        <><Package className="h-3 w-3 mr-1" /> BAIXO</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-100 font-medium">{product.name}</TableCell>
                  <TableCell className="text-gray-100">{product.category}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      product.stock_quantity === 0 ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {product.stock_quantity} {product.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-100">
                    {product.min_stock} {product.unit}
                  </TableCell>
                  <TableCell className="text-gray-100">{formatCurrency(product.cost_price)}</TableCell>
                  <TableCell className="text-gray-100">{formatDate(product.last_purchase_date)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreatePurchaseOrder(product)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Comprar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Avisos Importantes */}
      {criticalProducts.length > 0 && (
        <div className="bg-red-900/20 border-2 border-red-600 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-500 font-bold text-lg mb-3">⚠️ ATENÇÃO URGENTE: Produtos SEM ESTOQUE</h3>
              <p className="text-gray-300 mb-3">
                Os seguintes produtos estão completamente esgotados e precisam de reposição IMEDIATA:
              </p>
              <ul className="text-gray-300 space-y-2">
                {criticalProducts.map((item) => (
                  <li key={item.id} className="flex justify-between items-center bg-red-900/30 p-3 rounded">
                    <span className="font-medium">• {item.name}</span>
                    <Button
                      size="sm"
                      onClick={() => handleCreatePurchaseOrder(item)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Comprar Agora
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Criar Pedido */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Criar Pedido de Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Produto</p>
              <p className="text-gray-100 font-semibold text-lg">{selectedProduct?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Estoque Atual</p>
                <p className="text-red-500 font-bold text-xl">
                  {selectedProduct?.stock_quantity} {selectedProduct?.unit}
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Estoque Mínimo</p>
                <p className="text-gray-100 font-bold text-xl">
                  {selectedProduct?.min_stock} {selectedProduct?.unit}
                </p>
              </div>
            </div>
            <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
              <p className="text-blue-400 text-sm mb-2">💡 Sugestão de Compra</p>
              <p className="text-gray-100 font-semibold">
                Recomendamos comprar pelo menos{' '}
                {Math.max(selectedProduct?.min_stock || 0, 10)} {selectedProduct?.unit}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Custo estimado: {formatCurrency((selectedProduct?.cost_price || 0) * Math.max(selectedProduct?.min_stock || 0, 10))}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-600">
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  handleMarkAsOrdered(selectedProduct?.id || '');
                  setIsDialogOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ir para Pedidos de Compra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReplenishmentAlerts;
