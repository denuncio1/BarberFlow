import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess } from '@/utils/toast';
import { ModeToggle } from './ModeToggle'; // Import ModeToggle
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Bell, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/contexts/SessionContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { session } = useSession();
  const navigate = useNavigate();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [criticalStockProducts, setCriticalStockProducts] = useState<any[]>([]);

  console.log("Current language:", i18n.language); // Log para depuração

  useEffect(() => {
    if (session) {
      fetchStockAlerts();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('header-stock-alerts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            fetchStockAlerts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchStockAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock, unit')
        .eq('user_id', session?.user?.id);

      if (error) throw error;

      const lowStock = data?.filter((item: any) => 
        item.stock_quantity <= (item.min_stock || 0)
      ) || [];

      setLowStockCount(lowStock.length);
      setCriticalStockProducts(lowStock.slice(0, 5)); // Mostrar apenas os 5 primeiros
    } catch (error) {
      console.error('Erro ao buscar alertas de estoque:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess(t('logout_success'));
  };

  const changeLanguage = (lng: string) => {
    console.log("Changing language to:", lng); // Log para depuração
    i18n.changeLanguage(lng);
  };

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <img src="/logo.png" alt="BarberFlow Logo" className="h-24 w-24" />
          <span className="text-2xl font-bold">BarberFlow</span>
        </Link>
        <div className="flex items-center space-x-4">
          {/* Stock Alerts Notification */}
          {lowStockCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs"
                  >
                    {lowStockCount}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-gray-800 border-gray-700">
                <div className="p-3 border-b border-gray-700">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold">Alertas de Estoque Baixo</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {lowStockCount} {lowStockCount === 1 ? 'produto precisa' : 'produtos precisam'} de reposição
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {criticalStockProducts.map((product) => (
                    <DropdownMenuItem
                      key={product.id}
                      onClick={() => navigate('/stock-control/alerts')}
                      className="cursor-pointer hover:bg-gray-700 p-3"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-medium text-gray-100">{product.name}</span>
                        <span className="text-xs text-gray-400">
                          Estoque: {product.stock_quantity === 0 ? (
                            <span className="text-red-500 font-semibold">ESGOTADO</span>
                          ) : (
                            <span className="text-yellow-500">
                              {product.stock_quantity} {product.unit} (mín: {product.min_stock})
                            </span>
                          )}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-700">
                  <Button
                    onClick={() => navigate('/stock-control/alerts')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    Ver Todos os Alertas
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Language Flags */}
          <div className="flex space-x-2">
            <button onClick={() => changeLanguage('pt')} className="focus:outline-none">
              <img src="/Flags/BR.webp" alt="Português" className="h-6 w-auto rounded-sm" />
            </button>
            <button onClick={() => changeLanguage('es')} className="focus:outline-none">
              <img src="/Flags/ES.webp" alt="Español" className="h-6 w-auto rounded-sm" />
            </button>
            <button onClick={() => changeLanguage('en')} className="focus:outline-none">
              <img src="/Flags/US.webp" alt="English" className="h-6 w-auto rounded-sm" />
            </button>
          </div>
          {/* Theme Toggle */}
          <ModeToggle />
          <Button onClick={handleLogout} variant="secondary" className="text-black dark:text-white hover:bg-primary/80">
            {t('logout_button')}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;