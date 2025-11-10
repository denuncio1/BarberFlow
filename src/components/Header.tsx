import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess } from '@/utils/toast';
import { ModeToggle } from './ModeToggle'; // Import ModeToggle
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Header = () => {
  const { t, i18n } = useTranslation();

  console.log("Current language:", i18n.language); // Log para depuração

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
          <img src="/logo.png" alt="BarberFlow Logo" className="h-10 w-10" />
          <span className="text-2xl font-bold">BarberFlow</span>
        </Link>
        <div className="flex items-center space-x-4">
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
          <Button onClick={handleLogout} variant="secondary" className="text-primary-foreground hover:bg-primary/80">
            {t('logout_button')}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;