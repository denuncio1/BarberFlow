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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Link, X } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome do produto deve ter pelo menos 2 caracteres." }),
  description: z.string().optional().or(z.literal('')),
  price: z.coerce.number().min(0, { message: "O preço de venda deve ser um valor positivo." }), // Corresponds to sale_price
  cost_price: z.coerce.number().min(0, { message: "O preço de custo deve ser um valor positivo." }).optional(),
  producer: z.string().optional().or(z.literal('')),
  stock_quantity: z.coerce.number().int().min(0, { message: "A quantidade em estoque deve ser um número inteiro não negativo." }).default(0),
  category: z.enum(['Vitrine', 'Estoque interno', 'Outros']).default('Outros'), // Corresponds to 'Type' in UI
  image_url: z.string().url({ message: "Por favor, insira uma URL válida para a imagem." }).optional().or(z.literal('')),
});

interface ProductRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ProductRegistrationForm: React.FC<ProductRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useSession();
  const { t } = useTranslation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      cost_price: 0,
      producer: "",
      stock_quantity: 0,
      category: "Outros",
      image_url: "",
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('O arquivo deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      form.setValue('image_url', publicUrl);
      setImagePreview(publicUrl);
      showSuccess('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      showError('Erro ao enviar imagem: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    form.setValue('image_url', url);
    setImagePreview(url || null);
  };

  const clearImage = () => {
    form.setValue('image_url', '');
    setImagePreview(null);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError(t('unauthenticated_user_error'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: values.name,
          description: values.description || null,
          price: values.price, // This is sale_price
          cost_price: values.cost_price || null,
          producer: values.producer || null,
          stock_quantity: values.stock_quantity,
          category: values.category, // This is 'type' in the UI
          image_url: values.image_url || null,
        })
        .select();

      if (error) {
        throw error;
      }

      showSuccess(t('product_registration_success'));
      form.reset(); // Clear the form
      setImagePreview(null);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao cadastrar produto:", error);
      showError(t('product_registration_error') + error.message);
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
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('product_name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('product_name_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
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
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('product_description_label')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('product_description_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
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
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('product_sale_price_label')}</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder={t('product_sale_price_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cost_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('product_cost_price_label')}</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder={t('product_cost_price_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="producer"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('product_producer_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('product_producer_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stock_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('product_stock_quantity_label')}</FormLabel>
              <FormControl>
                <Input type="number" placeholder={t('product_stock_quantity_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category" // Using 'category' for 'Type' in UI
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('product_type_label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder={t('product_type_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                  <SelectItem value="Vitrine">{t('product_type_vitrine')}</SelectItem>
                  <SelectItem value="Estoque interno">{t('product_type_internal_stock')}</SelectItem>
                  <SelectItem value="Outros">{t('product_type_other')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('product_image_url_label')}</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Tabs defaultValue="url" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
                      <TabsTrigger value="url" className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                      </TabsTrigger>
                      <TabsTrigger value="camera" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Câmera
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="space-y-2">
                      <Input
                        placeholder={t('product_image_url_placeholder')}
                        value={field.value || ''}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      />
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      />
                      {isUploading && <p className="text-sm text-gray-500">Enviando...</p>}
                    </TabsContent>

                    <TabsContent value="camera" className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      />
                      {isUploading && <p className="text-sm text-gray-500">Enviando...</p>}
                    </TabsContent>
                  </Tabs>

                  {imagePreview && (
                    <div className="relative w-32 h-32 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
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
            {t('product_registration_submit_button')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductRegistrationForm;