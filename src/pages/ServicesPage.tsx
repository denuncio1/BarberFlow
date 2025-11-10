"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import ServiceRegistrationForm from '@/components/ServiceRegistrationForm';
import ServiceListItem from '@/components/ServiceListItem';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_visible_to_clients: boolean;
  type: string;
  category: string;
}

const ServicesPage = () => {
  const { session, isLoading, user } = useSession();
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('manual'); // 'manual', 'name_asc', 'name_desc', 'price_asc', 'price_desc'
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState<boolean>(false);

  const fetchServices = async () => {
    if (!user) return;
    setLoadingServices(true);
    try {
      let query = supabase
        .from('services')
        .select('id, name, description, price, duration_minutes, is_visible_to_clients, type, category')
        .eq('user_id', user.id); // Filter by the current user (manager)

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      // Apply sorting
      switch (sortBy) {
        case 'name_asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name_desc':
          query = query.order('name', { ascending: false });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'manual':
        default:
          // No specific order for 'manual' or default
          query = query.order('created_at', { ascending: true }); // Fallback to creation date
          break;
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      setServices(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar serviços:", error);
      showError(t('fetch_services_error') + error.message);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user, searchTerm, filterCategory, sortBy]); // Re-fetch services when filters or sort change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices(); // Re-fetch services with the current search term
  };

  const handleServiceAdded = () => {
    setIsAddServiceDialogOpen(false);
    fetchServices(); // Refresh service list after adding a new service
  };

  const handleServiceClick = (serviceId: string) => {
    showSuccess(`Detalhes do serviço ${serviceId} (em desenvolvimento)!`);
    // Implement navigation to service detail page later
  };

  // Placeholder for reordering functionality
  const handleReorderUp = (serviceId: string) => {
    showSuccess(`Reordenar serviço ${serviceId} para cima (em desenvolvimento)!`);
  };

  const handleReorderDown = (serviceId: string) => {
    showSuccess(`Reordenar serviço ${serviceId} para baixo (em desenvolvimento)!`);
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
        <h1 className="text-3xl font-bold">{t('services_title')}</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                <Plus className="h-4 w-4 mr-2" /> {t('add_service_button')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">{t('service_registration_title')}</DialogTitle>
              </DialogHeader>
              <ServiceRegistrationForm onSuccess={handleServiceAdded} onCancel={() => setIsAddServiceDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select onValueChange={setSortBy} defaultValue={sortBy}>
          <SelectTrigger className="w-[180px] bg-gray-700 text-gray-100 border-gray-600">
            <SelectValue placeholder={t('order_by_label')} />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            <SelectItem value="manual">{t('order_by_manual')}</SelectItem>
            <SelectItem value="name_asc">{t('service_name_header')} (A-Z)</SelectItem>
            <SelectItem value="name_desc">{t('service_name_header')} (Z-A)</SelectItem>
            <SelectItem value="price_asc">{t('service_value_header')} (Menor para Maior)</SelectItem>
            <SelectItem value="price_desc">{t('service_value_header')} (Maior para Menor)</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setFilterCategory} defaultValue={filterCategory}>
          <SelectTrigger className="w-[180px] bg-gray-700 text-gray-100 border-gray-600">
            <SelectValue placeholder={t('category_label')} />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            <SelectItem value="all">{t('category_all')}</SelectItem>
            <SelectItem value="Haircut">{t('service_category_haircut')}</SelectItem>
            <SelectItem value="Beard">{t('service_category_beard')}</SelectItem>
            <SelectItem value="Finish">{t('service_category_finish')}</SelectItem>
            <SelectItem value="Other">{t('service_category_other')}</SelectItem>
          </SelectContent>
        </Select>

        <form onSubmit={handleSearch} className="flex flex-grow max-w-md space-x-2">
          <Input
            type="text"
            placeholder={t('search_by_name_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-gray-700 text-gray-100 border-gray-600 placeholder:text-gray-400"
          />
          <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            <Search className="h-4 w-4 mr-2" /> {t('search_button')}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-700">
            <TableRow>
              <TableHead className="w-[60px] text-gray-300">{t('service_order_header')}</TableHead>
              <TableHead className="text-gray-300">{t('service_name_header')}</TableHead>
              <TableHead className="text-gray-300">{t('service_value_header')}</TableHead>
              <TableHead className="text-gray-300">{t('service_time_header')}</TableHead>
              <TableHead className="text-gray-300">{t('service_visible_clients_header')}</TableHead>
              <TableHead className="text-gray-300">{t('service_type_header')}</TableHead>
              <TableHead className="text-gray-300">{t('service_category_header')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingServices ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-gray-400">
                  {t('loading_services')}
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-gray-400">
                  {t('no_services_found')}
                </TableCell>
              </TableRow>
            ) : (
              services.map(service => (
                <ServiceListItem
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  price={service.price}
                  duration_minutes={service.duration_minutes}
                  is_visible_to_clients={service.is_visible_to_clients}
                  type={service.type}
                  category={service.category}
                  onClick={handleServiceClick}
                  onReorderUp={handleReorderUp}
                  onReorderDown={handleReorderDown}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServicesPage;