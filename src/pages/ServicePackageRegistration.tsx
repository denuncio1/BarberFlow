"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import ServicePackageForm from '@/components/ServicePackageForm';

interface ServicePackage {
  id: string;
  name: string;
  value: number;
  service_time: string;
  type: string;
  service_quantity: number;
}

const ServicePackageRegistration = () => {
  const { t } = useTranslation();
  const { user } = useSession();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<ServicePackage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPackages(packages);
    } else {
      const filtered = packages.filter(pkg =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPackages(filtered);
    }
  }, [searchTerm, packages]);

  const fetchPackages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setPackages(data || []);
      setFilteredPackages(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pacotes:', error);
      showError('Erro ao carregar pacotes de serviços');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchPackages();
    setIsDialogOpen(false);
    setEditingPackage(null);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingPackage(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Pacote de serviços cadastrados
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              onClick={() => setEditingPackage(null)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar novo pacote de serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] bg-gray-800 text-gray-100 border-gray-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-100">
                {editingPackage ? 'Editar Pacote de Serviço' : 'Cadastrar Novo Pacote de Serviço'}
              </DialogTitle>
            </DialogHeader>
            <ServicePackageForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              editingPackage={editingPackage}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500" />
        <Input
          placeholder="Buscar por nome do pacote"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
        />
      </div>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-800">
            <TableRow>
              <TableHead className="text-gray-300 uppercase text-xs">Name</TableHead>
              <TableHead className="text-gray-300 uppercase text-xs">Value</TableHead>
              <TableHead className="text-gray-300 uppercase text-xs">Tempo de atendimento</TableHead>
              <TableHead className="text-gray-300 uppercase text-xs">Type</TableHead>
              <TableHead className="text-gray-300 uppercase text-xs">Quantidade de serviços</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredPackages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  {searchTerm ? 'Nenhum pacote encontrado.' : 'Nenhum pacote cadastrado.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPackages.map((pkg) => (
                <TableRow
                  key={pkg.id}
                  className="cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => handlePackageClick(pkg)}
                >
                  <TableCell className="font-semibold text-gray-100">{pkg.name}</TableCell>
                  <TableCell className="text-gray-300">{formatCurrency(pkg.value)}</TableCell>
                  <TableCell className="text-gray-300">{pkg.service_time}</TableCell>
                  <TableCell className="text-gray-300">{pkg.type}</TableCell>
                  <TableCell className="text-gray-300">{pkg.service_quantity}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServicePackageRegistration;
