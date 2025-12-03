"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import PaymentMethodRegistrationForm from '@/components/PaymentMethodRegistrationForm';
import PaymentMethodListItem from '@/components/PaymentMethodListItem';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PaymentMethod {
  id: string;
  name: string;
  percentage: number;
  receipt_in_days: number;
  take_out_of_barbershop: boolean;
}

const PaymentMethodsPage = () => {
  const { session, isLoading, user } = useSession();
  const { t } = useTranslation();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState<boolean>(true);
  const [isAddPaymentMethodDialogOpen, setIsAddPaymentMethodDialogOpen] = useState<boolean>(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);

  const fetchPaymentMethods = async () => {
    if (!user) return;
    setLoadingPaymentMethods(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('id, name, percentage, receipt_in_days, take_out_of_barbershop')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      setPaymentMethods(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar formas de pagamento:", error);
      showError(t('fetch_payment_methods_error') + error.message);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const handlePaymentMethodAdded = () => {
    setIsAddPaymentMethodDialogOpen(false);
    setEditingPaymentMethod(null);
    fetchPaymentMethods(); // Refresh list after adding a new method
  };

  const handlePaymentMethodClick = (paymentMethodId: string) => {
    const method = paymentMethods.find(pm => pm.id === paymentMethodId);
    if (method) {
      setEditingPaymentMethod(method);
      setIsAddPaymentMethodDialogOpen(true);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">{t('loading')}</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-4 bg-gray-900 min-h-full text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('payment_methods_title')}</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddPaymentMethodDialogOpen} onOpenChange={setIsAddPaymentMethodDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                <Plus className="h-4 w-4 mr-2" /> {t('add_payment_method_button')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">
                  {editingPaymentMethod ? t('payment_method_edit_title') || 'Editar Forma de Pagamento' : t('payment_method_registration_title')}
                </DialogTitle>
              </DialogHeader>
              <PaymentMethodRegistrationForm 
                onSuccess={handlePaymentMethodAdded} 
                onCancel={() => {
                  setIsAddPaymentMethodDialogOpen(false);
                  setEditingPaymentMethod(null);
                }} 
                editingPaymentMethod={editingPaymentMethod}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-700">
            <TableRow>
              <TableHead className="text-gray-300">{t('payment_method_name_header')}</TableHead>
              <TableHead className="text-gray-300">{t('payment_method_percentage_header')}</TableHead>
              <TableHead className="text-gray-300">{t('payment_method_receipt_days_header')}</TableHead>
              <TableHead className="text-gray-300">{t('payment_method_take_out_header')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingPaymentMethods ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-400">
                  {t('loading_payment_methods')}
                </TableCell>
              </TableRow>
            ) : paymentMethods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-400">
                  {t('no_payment_methods_found')}
                </TableCell>
              </TableRow>
            ) : (
              paymentMethods.map(method => (
                <PaymentMethodListItem
                  key={method.id}
                  id={method.id}
                  name={method.name}
                  percentage={method.percentage}
                  receipt_in_days={method.receipt_in_days}
                  take_out_of_barbershop={method.take_out_of_barbershop}
                  onClick={handlePaymentMethodClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaymentMethodsPage;