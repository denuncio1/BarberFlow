"use client";

import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight } from 'lucide-react';

const formSchema = z.object({
  name: z.string().optional(),
  percentage: z.coerce.number().min(0, { message: "A porcentagem deve ser um valor positivo ou zero." }),
  receipt_in_days: z.coerce.number().int().min(0, { message: "Os dias de recebimento devem ser um número inteiro não negativo." }),
  take_out_of_barbershop: z.boolean().default(false),
});

interface PaymentMethodRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingPaymentMethod?: {
    id: string;
    name: string;
    percentage: number;
    receipt_in_days: number;
    take_out_of_barbershop: boolean;
  } | null;
}

const PaymentMethodRegistrationForm: React.FC<PaymentMethodRegistrationFormProps> = ({ onSuccess, onCancel, editingPaymentMethod }) => {
  const { user } = useSession();
  const { t } = useTranslation();

  const [selectedFunction, setSelectedFunction] = useState<string>("pix");
  const [selectedFlag, setSelectedFlag] = useState<string>("pix");

  const functionOptions = React.useMemo(() => [
    { value: "pix", label: t('payment_method_function_pix') },
    { value: "credit", label: t('payment_method_function_credit') },
    { value: "debit", label: t('payment_method_function_debit') },
    { value: "cash", label: t('payment_method_function_cash') },
  ], [t]);

  const flagOptions = React.useMemo(() => [
    { value: "pix", label: t('payment_method_function_pix') },
    { value: "visa", label: t('payment_method_flag_visa') },
    { value: "mastercard", label: t('payment_method_flag_mastercard') },
    { value: "elo", label: t('payment_method_flag_elo') },
    { value: "amex", label: t('payment_method_flag_amex') },
  ], [t]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingPaymentMethod?.name || "",
      percentage: editingPaymentMethod?.percentage || 0,
      receipt_in_days: editingPaymentMethod?.receipt_in_days || 0,
      take_out_of_barbershop: editingPaymentMethod?.take_out_of_barbershop || false,
    },
  });

  React.useEffect(() => {
    if (editingPaymentMethod) {
      form.reset({
        name: editingPaymentMethod.name,
        percentage: editingPaymentMethod.percentage,
        receipt_in_days: editingPaymentMethod.receipt_in_days,
        take_out_of_barbershop: editingPaymentMethod.take_out_of_barbershop,
      });
      // Parse function and flag from name if possible
      const nameParts = editingPaymentMethod.name.split(' - ');
      if (nameParts.length === 2) {
        setSelectedFunction(nameParts[0].toLowerCase());
        setSelectedFlag(nameParts[1].toLowerCase());
      }
    }
  }, [editingPaymentMethod, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('onSubmit called!');
    console.log('Form values:', values);
    console.log('User:', user);
    
    if (!user) {
      console.error('No user found!');
      showError(t('unauthenticated_user_error'));
      return;
    }

    try {
      // Get translated labels for function and flag
      const functionLabel = functionOptions.find(opt => opt.value === selectedFunction)?.label || selectedFunction;
      const flagLabel = flagOptions.find(opt => opt.value === selectedFlag)?.label || selectedFlag;
      const paymentName = `${functionLabel} - ${flagLabel}`;
      
      console.log('Saving payment method:', {
        name: paymentName,
        percentage: values.percentage,
        receipt_in_days: values.receipt_in_days,
        take_out_of_barbershop: values.take_out_of_barbershop,
        selectedFunction,
        selectedFlag,
        functionLabel,
        flagLabel,
      });
      
      const paymentData = {
        user_id: user.id,
        name: paymentName,
        percentage: values.percentage,
        receipt_in_days: values.receipt_in_days,
        take_out_of_barbershop: values.take_out_of_barbershop,
      };

      let data, error;

      if (editingPaymentMethod) {
        // Update existing payment method
        const result = await supabase
          .from('payment_methods')
          .update(paymentData)
          .eq('id', editingPaymentMethod.id)
          .select();
        data = result.data;
        error = result.error;
      } else {
        // Insert new payment method
        const result = await supabase
          .from('payment_methods')
          .insert(paymentData)
          .select();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Save successful! Data:', data);
      showSuccess(editingPaymentMethod ? t('payment_method_update_success') || 'Forma de pagamento atualizada com sucesso!' : t('payment_method_registration_success'));
      form.reset();
      setSelectedFunction("pix");
      setSelectedFlag("pix");
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar forma de pagamento:", error);
      showError(t('payment_method_registration_error') + error.message);
    }
  };

  const onError = (errors: any) => {
    console.log('Form validation errors:', errors);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        {/* Function Field */}
        <div className="space-y-3">
          <label className="block text-gray-700 dark:text-gray-400 uppercase tracking-wider text-xs font-bold">
            {t('payment_method_function_label')}
          </label>
          <Select value={selectedFunction} onValueChange={setSelectedFunction}>
            <SelectTrigger className="w-full h-14 bg-gray-700 text-gray-100 border-gray-600">
              <SelectValue>
                {functionOptions.find(opt => opt.value === selectedFunction)?.label || t('payment_method_function_pix')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
              {functionOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="hover:bg-gray-700">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Flag Field */}
        <div className="space-y-3">
          <label className="block text-gray-700 dark:text-gray-400 uppercase tracking-wider text-xs font-bold">
            {t('payment_method_flag_label')}
          </label>
          <Select value={selectedFlag} onValueChange={setSelectedFlag}>
            <SelectTrigger className="w-full h-14 bg-gray-700 text-gray-100 border-gray-600">
              <SelectValue>
                {flagOptions.find(opt => opt.value === selectedFlag)?.label || t('payment_method_function_pix')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
              {flagOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="hover:bg-gray-700">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Receipt in days */}
        <FormField
          control={form.control}
          name="receipt_in_days"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <label className="block text-gray-700 dark:text-gray-400 uppercase tracking-wider text-xs font-bold">
                {t('payment_method_receipt_days_label')}
              </label>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  className="bg-gray-700 text-gray-100 border-gray-600 h-14 text-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Percentage */}
        <FormField
          control={form.control}
          name="percentage"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <label className="block text-gray-700 dark:text-gray-400 uppercase tracking-wider text-xs font-bold">
                {t('payment_method_percentage_label')}
              </label>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...field} 
                  className="bg-gray-700 text-gray-100 border-gray-600 h-14 text-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is this percentage discounted from barbers? */}
        <FormField
          control={form.control}
          name="take_out_of_barbershop"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-gray-100 font-medium">
                {t('payment_method_discount_question')}
              </FormLabel>
              <p className="text-sm text-gray-400">
                {t('payment_method_discount_explanation')}
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={`flex-1 h-14 text-base ${
                    field.value 
                      ? 'bg-gray-700 text-gray-100 border-2 border-gray-500' 
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {t('payment_method_yes')}
                </Button>
                <Button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={`flex-1 h-14 text-base ${
                    !field.value 
                      ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600 font-semibold' 
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {t('payment_method_no')}
                </Button>
              </div>
            </FormItem>
          )}
        />

        {/* Hidden name field - will use function + flag */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <input type="hidden" {...field} value={`${selectedFunction} - ${selectedFlag}`} />
          )}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-12 bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
            >
              {t('cancel_button') || 'Cancelar'}
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 h-12 bg-yellow-500 text-gray-900 hover:bg-yellow-600 font-semibold"
          >
            {t('payment_method_registration_submit_button') || 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentMethodRegistrationForm;