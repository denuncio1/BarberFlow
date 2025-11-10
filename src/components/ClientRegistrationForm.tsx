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
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns'; // Added parseISO
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  first_name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  last_name: z.string().min(2, { message: "O sobrenome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')), // Changed to string
  avatar_url: z.string().url({ message: "Por favor, insira uma URL válida para o avatar." }).optional().or(z.literal('')),
  status: z.enum(['active', 'blocked']).default('active'),
});

interface ClientRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ClientRegistrationForm: React.FC<ClientRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useSession();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      date_of_birth: "", // Default to empty string
      avatar_url: "",
      status: "active",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError(t('unauthenticated_user_error'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email || null,
          phone: values.phone || null,
          date_of_birth: values.date_of_birth || null, // Send as string or null
          avatar_url: values.avatar_url || null,
          status: values.status,
        })
        .select();

      if (error) {
        throw error;
      }

      showSuccess(t('client_registration_success'));
      form.reset(); // Clear the form
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao cadastrar cliente:", error);
      showError(t('client_registration_error') + error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('client_registration_name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('client_registration_name_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('client_registration_lastname_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('client_registration_lastname_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('client_registration_email_label')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('client_registration_email_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('client_registration_phone_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('client_registration_phone_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('client_registration_dob_label')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder={t('client_registration_dob_select_placeholder')}
                        value={field.value ? format(parseISO(field.value), 'dd/MM/yyyy', { locale: ptBR }) : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full pl-3 pr-10 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 cursor-pointer" />
                    </div>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? parseISO(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} // Format to ISO string
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('client_registration_avatar_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('client_registration_avatar_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('client_status_label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder={t('client_status_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                  <SelectItem value="active">{t('client_status_active')}</SelectItem>
                  <SelectItem value="blocked">{t('client_status_blocked')}</SelectItem>
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
            {t('client_registration_submit_button')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientRegistrationForm;