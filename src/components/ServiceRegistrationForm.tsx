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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome do serviço deve ter pelo menos 2 caracteres." }),
  description: z.string().optional().or(z.literal('')),
  price: z.coerce.number().min(0, { message: "O preço deve ser um valor positivo." }),
  duration_minutes: z.coerce.number().int().min(1, { message: "A duração deve ser de pelo menos 1 minuto." }),
  is_visible_to_clients: z.boolean().default(true),
  type: z.enum(['Normal', 'Subscription']).default('Normal'),
  category: z.enum(['Haircut', 'Beard', 'Finish', 'Other']).default('Other'),
});

interface ServiceRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    duration_minutes: number;
    is_visible_to_clients: boolean;
    type: string;
    category: string;
  };
}

const ServiceRegistrationForm: React.FC<ServiceRegistrationFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { user } = useSession();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      duration_minutes: initialData?.duration_minutes || 30,
      is_visible_to_clients: initialData?.is_visible_to_clients ?? true,
      type: (initialData?.type as 'Normal' | 'Subscription') || "Normal",
      category: (initialData?.category as 'Haircut' | 'Beard' | 'Finish' | 'Other') || "Other",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError(t('unauthenticated_user_error'));
      return;
    }

    try {
      const serviceData = {
        name: values.name,
        description: values.description || null,
        price: values.price,
        duration_minutes: values.duration_minutes,
        is_visible_to_clients: values.is_visible_to_clients,
        type: values.type,
        category: values.category,
      };

      if (initialData) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', initialData.id)
          .eq('user_id', user.id);

        if (error) throw error;
        showSuccess('Serviço atualizado com sucesso!');
      } else {
        // Insert new service
        const { error } = await supabase
          .from('services')
          .insert({
            user_id: user.id,
            ...serviceData,
          });

        if (error) throw error;
        showSuccess(t('service_registration_success'));
        form.reset();
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar serviço:", error);
      showError((initialData ? 'Erro ao atualizar serviço: ' : t('service_registration_error')) + error.message);
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
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('service_name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('service_name_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('service_description_label')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('service_description_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('service_price_label')}</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder={t('service_price_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('service_duration_label')}</FormLabel>
              <FormControl>
                <Input type="number" placeholder={t('service_duration_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_visible_to_clients"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <div className="space-y-0.5">
                <FormLabel className="text-base text-gray-900 dark:text-gray-100">{t('service_visible_clients_label')}</FormLabel>
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
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('service_type_label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder={t('service_type_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                      <SelectItem value="Normal">{t('service_type_normal')}</SelectItem>
                      <SelectItem value="Subscription">{t('service_type_subscription')}</SelectItem>
                    </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('service_category_label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder={t('service_category_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                      <SelectItem value="Haircut">{t('service_category_haircut')}</SelectItem>
                      <SelectItem value="Beard">{t('service_category_beard')}</SelectItem>
                      <SelectItem value="Finish">{t('service_category_finish')}</SelectItem>
                      <SelectItem value="Other">{t('service_category_other')}</SelectItem>
                    </SelectContent>
              </Select>
              <FormMessage />
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
            {t('service_registration_submit_button')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ServiceRegistrationForm;