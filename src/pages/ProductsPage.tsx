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
import ProductRegistrationForm from '@/components/ProductRegistrationForm';
import ProductListItem from '@/components/ProductListItem';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number; // This is sale_price
  cost_price: number | null;
  producer: string | null;
  stock_quantity: number;
  category: string | null; // This is 'type' in the UI
  image_url: string | null;
}

const ProductsPage = () => {
  const { session, isLoading, user } = useSession();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterProducer, setFilterProducer] = useState<string>('all');
  const [producers, setProducers] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState<boolean>(false);

  const fetchProducts = async () => {
    if (!user) return;
    setLoadingProducts(true);
    try {
      let query = supabase
        .from('products')
        .select('id, name, description, price, cost_price, producer, stock_quantity, category, image_url')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (filterProducer !== 'all') {
        query = query.eq('producer', filterProducer);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      setProducts(data || []);

      // Extract unique producers for the filter dropdown
      const uniqueProducers = Array.from(new Set(data?.map(p => p.producer).filter(Boolean) as string[]));
      setProducers(uniqueProducers);

    } catch (error: any) {
      console.error("Erro ao buscar produtos:", error);
      showError(t('fetch_products_error') + error.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, searchTerm, filterProducer]); // Re-fetch products when filters or search change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(); // Re-fetch products with the current search term
  };

  const handleProductAdded = () => {
    setIsAddProductDialogOpen(false);
    fetchProducts(); // Refresh product list after adding a new product
  };

  const handleProductClick = (productId: string) => {
    showSuccess(`Detalhes do produto ${productId} (em desenvolvimento)!`);
    // Implement navigation to product detail page later
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
        <h1 className="text-3xl font-bold">{t('products_title')}</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                <Plus className="h-4 w-4 mr-2" /> {t('add_product_button')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">{t('product_registration_title')}</DialogTitle>
              </DialogHeader>
              <ProductRegistrationForm onSuccess={handleProductAdded} onCancel={() => setIsAddProductDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select onValueChange={setFilterProducer} defaultValue={filterProducer}>
          <SelectTrigger className="w-[180px] bg-gray-700 text-gray-100 border-gray-600">
            <SelectValue placeholder={t('filter_by_producer_label')} />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            <SelectItem value="all">{t('all_producers')}</SelectItem>
            {producers.map(producer => (
              <SelectItem key={producer} value={producer}>{producer}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <form onSubmit={handleSearch} className="flex flex-grow max-w-md space-x-2">
          <Input
            type="text"
            placeholder={t('filter_by_product_name_placeholder')}
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
              <TableHead className="text-gray-300">{t('product_name_header')}</TableHead>
              <TableHead className="text-gray-300">{t('product_sale_price_header')}</TableHead>
              <TableHead className="text-gray-300">{t('product_cost_price_header')}</TableHead>
              <TableHead className="text-gray-300">{t('product_producer_header')}</TableHead>
              <TableHead className="text-gray-300">{t('product_type_header')}</TableHead>
              <TableHead className="text-gray-300">{t('product_stock_quantity_header')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingProducts ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                  {t('loading_products')}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                  {t('no_products_found')}
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <ProductListItem
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  sale_price={product.price}
                  cost_price={product.cost_price || undefined}
                  producer={product.producer || undefined}
                  type={product.category || undefined} // Using 'category' for 'type' in UI
                  stock_quantity={product.stock_quantity}
                  onClick={handleProductClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductsPage;