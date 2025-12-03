"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StockMovementForm from '@/components/StockMovementForm';
import { showSuccess, showError } from '@/utils/toast';

interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: 'entry' | 'exit';
  quantity: number;
  reason: string;
  location_id: string;
  location_name: string;
  created_at: string;
  user_id: string;
}

const StockMovements = () => {
  const { session, isLoading } = useSession();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchMovements();
    }
  }, [session]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products!inner(name),
          stock_locations!inner(name)
        `)
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || 'Produto Desconhecido',
        movement_type: item.movement_type,
        quantity: item.quantity,
        reason: item.reason,
        location_id: item.location_id,
        location_name: item.stock_locations?.name || 'Local Desconhecido',
        created_at: item.created_at,
        user_id: item.user_id,
      })) || [];

      setMovements(formattedData);
    } catch (error: any) {
      showError('Erro ao buscar movimentações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter(
    (movement) =>
      movement.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.location_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMovement = () => {
    setEditingMovement(null);
    setIsDialogOpen(true);
  };

  const handleEditMovement = (movement: StockMovement) => {
    setEditingMovement(movement);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMovement(null);
  };

  const handleSaveSuccess = () => {
    fetchMovements();
    handleCloseDialog();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <h1 className="text-3xl font-bold text-gray-100">Registro de Entradas e Saídas</h1>
        <Button onClick={handleAddMovement} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Movimentação
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-gray-800 p-4 rounded-lg">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Filtrar por produto, motivo ou local"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-700 border-gray-600 text-gray-100"
        />
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-700 hover:bg-gray-700">
              <TableHead className="text-gray-100 font-bold">DATA/HORA</TableHead>
              <TableHead className="text-gray-100 font-bold">PRODUTO</TableHead>
              <TableHead className="text-gray-100 font-bold">TIPO</TableHead>
              <TableHead className="text-gray-100 font-bold">QUANTIDADE</TableHead>
              <TableHead className="text-gray-100 font-bold">LOCAL</TableHead>
              <TableHead className="text-gray-100 font-bold">MOTIVO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  Carregando movimentações...
                </TableCell>
              </TableRow>
            ) : filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  {searchTerm ? 'Nenhuma movimentação corresponde à sua pesquisa.' : 'Nenhuma movimentação registrada.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => (
                <TableRow
                  key={movement.id}
                  className="cursor-pointer hover:bg-gray-700 border-gray-700"
                  onClick={() => handleEditMovement(movement)}
                >
                  <TableCell className="text-gray-100">{formatDate(movement.created_at)}</TableCell>
                  <TableCell className="text-gray-100">{movement.product_name}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        movement.movement_type === 'entry'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {movement.movement_type === 'entry' ? 'ENTRADA' : 'SAÍDA'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-100">{movement.quantity}</TableCell>
                  <TableCell className="text-gray-100">{movement.location_name}</TableCell>
                  <TableCell className="text-gray-100">{movement.reason}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingMovement ? 'Detalhes da Movimentação' : 'Registrar Movimentação'}
            </DialogTitle>
          </DialogHeader>
          <StockMovementForm
            editingMovement={editingMovement}
            onClose={handleCloseDialog}
            onSaveSuccess={handleSaveSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockMovements;
