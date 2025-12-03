"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, Trash2, Eye, CheckCircle, XCircle, Clock, TruckIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string;
  status: string;
  total_amount: number;
  supplier_id?: string;
  suppliers?: Supplier;
}

interface OrderItem {
  id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  received_quantity?: number;
  unit_price: number;
  total_price: number;
}

const PurchaseOrders = () => {
  const { session, isLoading, user } = useSession();
  
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Novo Pedido
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Novo Item
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  
  // Detalhes do Pedido
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderItem[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOrders(),
      fetchSuppliers(),
      fetchProducts()
    ]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (id, name, contact_name, phone, email)
        `)
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      if (error) {
        if (error.message.includes('does not exist')) {
          console.error('Tabelas não criadas. Execute o SQL: create_purchase_orders_tables.sql');
          showError('Execute o script SQL create_purchase_orders_tables.sql no Supabase primeiro');
        }
        throw error;
      }
      setOrders(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      if (!error.message?.includes('does not exist')) {
        showError('Erro ao carregar pedidos');
      }
    }
  };

  const fetchSuppliers = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        if (error.message.includes('does not exist')) {
          console.error('Tabela suppliers não existe. Execute o SQL: create_purchase_orders_tables.sql');
        }
        throw error;
      }
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar fornecedores:', error);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;
    try {
      const { data, error} = await supabase
        .from('products')
        .select('id, name, price, cost_price')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const addItemToOrder = () => {
    if (!selectedProduct || itemQuantity <= 0 || itemPrice <= 0) {
      showError('Preencha todos os campos do item');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const newItem: OrderItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: itemQuantity,
      unit_price: itemPrice,
      total_price: itemQuantity * itemPrice,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct('');
    setItemQuantity(1);
    setItemPrice(0);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const createOrder = async () => {
    if (!user || orderItems.length === 0) {
      showError('Adicione pelo menos um item ao pedido');
      return;
    }

    if (!paymentDueDate) {
      showError('Informe a data de vencimento do pagamento');
      return;
    }

    try {
      setLoading(true);

      // Gerar número do pedido sequencial
      const { data: existingOrders } = await supabase
        .from('purchase_orders')
        .select('order_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let orderNumber = 'PO-000001';
      if (existingOrders && existingOrders.length > 0) {
        const lastNumber = existingOrders[0].order_number;
        const match = lastNumber.match(/PO-(\d+)/);
        if (match) {
          const nextNumber = parseInt(match[1]) + 1;
          orderNumber = `PO-${String(nextNumber).padStart(6, '0')}`;
        }
      }

      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          user_id: user.id,
          supplier_id: selectedSupplier || null,
          order_number: orderNumber,
          order_date: orderDate,
          expected_delivery_date: paymentDueDate || expectedDelivery || null,
          status: 'pending',
          total_amount: calculateTotal(),
          notes: orderNotes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar itens do pedido
      const items = orderItems.map(item => ({
        purchase_order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      showSuccess('Pedido criado com sucesso!');
      setIsNewOrderOpen(false);
      resetForm();
      fetchOrders();
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      showError('Erro ao criar pedido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSupplier('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDelivery('');
    setPaymentDueDate('');
    setOrderNotes('');
    setOrderItems([]);
    setSelectedProduct('');
    setItemQuantity(1);
    setItemPrice(0);
  };

  const viewOrderDetails = async (order: PurchaseOrder) => {
    setSelectedOrder(order);
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('purchase_order_id', order.id);

      if (error) throw error;
      setOrderDetails(data || []);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      showError('Erro ao carregar detalhes do pedido');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Buscar o pedido completo
      const { data: order } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name)')
        .eq('id', orderId)
        .single();

      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Se status = received, atualizar estoque e criar conta a pagar
      if (newStatus === 'received') {
        const { data: items } = await supabase
          .from('purchase_order_items')
          .select('*')
          .eq('purchase_order_id', orderId);

        const currentDate = new Date().toISOString();

        if (items) {
          for (const item of items) {
            if (item.product_id) {
              // Buscar estoque atual
              const { data: product } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', item.product_id)
                .single();

              if (product) {
                // Atualizar estoque
                await supabase
                  .from('products')
                  .update({ 
                    stock_quantity: (product.stock_quantity || 0) + item.quantity 
                  })
                  .eq('id', item.product_id);

                // Registrar movimento de estoque COM DATA ATUAL
                await supabase
                  .from('stock_movements')
                  .insert({
                    user_id: user?.id,
                    product_id: item.product_id,
                    movement_type: 'purchase',
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_value: item.total_price,
                    description: `Recebimento do pedido ${order?.order_number}`,
                    created_at: currentDate,
                  });
              }
            }
          }
        }

        // Criar conta a pagar
        const supplierName = order?.suppliers?.name || 'Fornecedor';
        const dueDate = order?.expected_delivery_date || new Date().toISOString().split('T')[0];
        
        await supabase
          .from('accounts_payable')
          .insert({
            user_id: user?.id,
            description: `Pedido de Compra ${order?.order_number} - ${supplierName}`,
            amount: order?.total_amount,
            due_date: dueDate,
            status: 'pending',
            category: 'Compra de Mercadorias',
            supplier_name: supplierName,
            reference_type: 'purchase_order',
            reference_id: orderId,
          });
      }

      showSuccess('Status atualizado com sucesso!');
      fetchOrders();
      setIsDetailsOpen(false);
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      showError('Erro ao atualizar status: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
      partially_received: { label: 'Parcial', variant: 'outline' as const, icon: Package },
      received: { label: 'Recebido', variant: 'default' as const, icon: TruckIcon },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  if (isLoading && !user) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Compra</h1>
          <p className="text-muted-foreground">Gestão de pedidos de fornecedores</p>
        </div>
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Pedido de Compra</DialogTitle>
              <DialogDescription>
                Preencha os dados do pedido e adicione os produtos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data do Pedido</Label>
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Previsão de Entrega</Label>
                  <Input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vencimento do Pagamento *</Label>
                  <Input
                    type="date"
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Observações do pedido..."
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Adicionar Produtos</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <Select value={selectedProduct} onValueChange={(value) => {
                      setSelectedProduct(value);
                      const product = products.find(p => p.id === value);
                      if (product) {
                        setItemPrice(product.cost_price || product.price || 0);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Produto" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Qtd"
                  />

                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Preço"
                  />
                </div>

                <Button
                  type="button"
                  onClick={addItemToOrder}
                  className="mt-3 w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              {orderItems.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Itens do Pedido</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>R$ {item.total_price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="font-semibold">Total do Pedido:</span>
                    <span className="text-2xl font-bold text-green-600">
                      R$ {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createOrder} disabled={orderItems.length === 0}>
                  Criar Pedido
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Pedidos</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="received">Recebidos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pedido encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.suppliers?.name || '-'}</TableCell>
                    <TableCell>{format(new Date(order.order_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {order.expected_delivery_date 
                        ? format(new Date(order.expected_delivery_date), 'dd/MM/yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="font-semibold">
                      R$ {order.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => viewOrderDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Pedido {selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription>
              Fornecedor: {selectedOrder?.suppliers?.name || '-'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">{selectedOrder && getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Total</Label>
                <div className="mt-1 text-xl font-bold">
                  R$ {selectedOrder?.total_amount.toFixed(2)}
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderDetails.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
                    <TableCell>R$ {item.total_price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {selectedOrder?.status === 'pending' && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => updateOrderStatus(selectedOrder.id, 'approved')}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  variant="default"
                  onClick={() => updateOrderStatus(selectedOrder.id, 'received')}
                  className="flex-1"
                >
                  <TruckIcon className="h-4 w-4 mr-2" />
                  Marcar como Recebido
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}

            {selectedOrder?.status === 'approved' && (
              <Button
                onClick={() => updateOrderStatus(selectedOrder.id, 'received')}
                className="w-full"
              >
                <TruckIcon className="h-4 w-4 mr-2" />
                Marcar como Recebido (Atualizar Estoque)
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
