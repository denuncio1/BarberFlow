import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess } from '@/utils/toast';

const Header = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess('Logout realizado com sucesso!');
  };

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <img src="/logo.png" alt="BarberFlow Logo" className="h-10 w-10" />
          <span className="text-2xl font-bold">BarberFlow</span>
        </Link>
        <Button onClick={handleLogout} variant="secondary" className="text-primary-foreground hover:bg-primary/80">
          Sair
        </Button>
      </div>
    </header>
  );
};

export default Header;