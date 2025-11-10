"use client";

import React from 'react';
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
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome da forma de pagamento deve ter pelo menos 2 caracteres." }),
  percentage: z.coerce.number().min(0, { message: "A porcentagem deve ser um valor positivo ou zero." }),
  receipt_in_days: z.coerce.number().int().min(0, { message: "Os dias de recebimento devem ser um número inteiro não negativo." }),
  take_out_of_barbershop: z.boolean().default(false),
});

interface PaymentMethodRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PaymentMethodRegistrationForm: React.FC<PaymentMethodRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useSession();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      percentage: 0,
      receipt_in_days: 0,
      take_out_of_barbershop: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError(t('unauthenticated_user_error'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          name: values.name,
          percentage: values.percentage,
          receipt_in_days: values.receipt_in_days,
          take_out_of_barbershop: values.take_out_of_barbershop,
        })
        .select();

      if (error) {
        throw error;
      }

      showSuccess(t('payment_method_registration_success'));
      form.reset(); // Clear the form
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao cadastrar forma de pagamento:", error);
      showError(t('payment_method_registration_error') + error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('payment_method_name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('payment_method_name_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('payment_method_percentage_label')}</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder={t('payment_method_percentage_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="receipt_in_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('payment_method_receipt_days_label')}</FormLabel>
              <FormControl>
                <Input type="number" placeholder={t('payment_method_receipt_days_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="take_out_of_barbershop"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <div className="space-y-0.5">
                <FormLabel className="text-base text-gray-900 dark:text-gray-100">{t('payment_method_take_out_label')}</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-600"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
              {t('cancel_button')}
            </Button>
          )}
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {t('payment_method_registration_submit_button')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentMethodRegistrationForm;