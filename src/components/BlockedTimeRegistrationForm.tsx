"use client";

import React, { useState, useEffect } from 'react';
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
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Zod schema for form validation
const formSchema = z.object({
  technician_id: z.string().uuid({ message: "Por favor, selecione um técnico." }),
  start_date: z.string().min(1, { message: "A data de início é obrigatória." }),
  start_time: z.string().min(1, { message: "A hora de início é obrigatória." }),
  end_date: z.string().min(1, { message: "A data de término é obrigatória." }),
  end_time: z.string().min(1, { message: "A hora de término é obrigatória." }),
  reason: z.string().optional().or(z.literal('')),
  is_recurring: z.boolean().default(false),
}).refine(
  (data) => {
    const startDateTime = new Date(`${data.start_date}T${data.start_time}`);
    const endDateTime = new Date(`${data.end_date}T${data.end_time}`);
    return endDateTime > startDateTime;
  },
  {
    message: "A data/hora de término deve ser posterior à data/hora de início.",
    path: ["end_time"], // This will show the error on the end_time field
  }
);

interface BlockedTimeRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id: string;
    technician_id: string;
    start_time: string; // ISO string
    end_time: string; // ISO string
    reason: string;
    is_recurring: boolean;
  } | null;
}

interface Technician {
  id: string;
  name: string;
}

const BlockedTimeRegistrationForm: React.FC<BlockedTimeRegistrationFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { user } = useSession();
  const { t } = useTranslation();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState<boolean>(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      technician_id: initialData?.technician_id || "",
      start_date: initialData ? format(parseISO(initialData.start_time), 'yyyy-MM-dd') : "",
      start_time: initialData ? format(parseISO(initialData.start_time), 'HH:mm') : "",
      end_date: initialData ? format(parseISO(initialData.end_time), 'yyyy-MM-dd') : "",
      end_time: initialData ? format(parseISO(initialData.end_time), 'HH:mm') : "",
      reason: initialData?.reason || "",
      is_recurring: initialData?.is_recurring || false,
    },
  });

  // Fetch technicians for the select dropdown
  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!user) return;
      setLoadingTechnicians(true);
      try {
        const { data, error } = await supabase
          .from('technicians')
          .select('id, name')
          .eq('user_id', user.id) // Only fetch technicians for the current user/manager
          .order('name', { ascending: true });

        if (error) throw error;
        setTechnicians(data || []);
      } catch (error: any) {
        console.error("Erro ao buscar técnicos:", error);
        showError(t('fetch_team_members_error') + error.message);
      } finally {
        setLoadingTechnicians(false);
      }
    };

    fetchTechnicians();
  }, [user, t]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError(t('unauthenticated_user_error'));
      return;
    }

    try {
      const startDateTime = new Date(`${values.start_date}T${values.start_time}`).toISOString();
      const endDateTime = new Date(`${values.end_date}T${values.end_time}`).toISOString();

      let result;
      if (initialData) {
        // Update existing blocked time
        result = await supabase
          .from('blocked_times')
          .update({
            technician_id: values.technician_id,
            start_time: startDateTime,
            end_time: endDateTime,
            reason: values.reason || null,
            is_recurring: values.is_recurring,
          })
          .eq('id', initialData.id)
          .eq('user_id', user.id); // Ensure user can only update their own
      } else {
        // Insert new blocked time
        result = await supabase
          .from('blocked_times')
          .insert({
            user_id: user.id,
            technician_id: values.technician_id,
            start_time: startDateTime,
            end_time: endDateTime,
            reason: values.reason || null,
            is_recurring: values.is_recurring,
          });
      }

      const { error } = result;

      if (error) {
        throw error;
      }

      showSuccess(initialData ? t('blocked_time_update_success') : t('blocked_time_registration_success'));
      form.reset(); // Clear the form
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar horário bloqueado:", error);
      showError((initialData ? t('blocked_time_update_error') : t('blocked_time_registration_error')) + error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="technician_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('blocked_time_technician_label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingTechnicians}>
                <FormControl>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder={t('blocked_time_technician_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 dark:text-gray-100">{t('blocked_time_start_date_label')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 dark:text-gray-100">{t('blocked_time_start_time_label')}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 dark:text-gray-100">{t('blocked_time_end_date_label')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 dark:text-gray-100">{t('blocked_time_end_time_label')}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('blocked_time_reason_label')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('blocked_time_reason_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <div className="space-y-0.5">
                <FormLabel className="text-base text-gray-900 dark:text-gray-100">{t('blocked_time_recurring_label')}</FormLabel>
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
            {initialData ? t('blocked_time_update_submit_button') : t('blocked_time_registration_submit_button')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BlockedTimeRegistrationForm;