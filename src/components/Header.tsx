import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react'; // Importar o ícone de calendário

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="BarberFlow Logo" className="h-10 w-10" />
          <span className="text-2xl font-bold">BarberFlow</span>
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/appointments" className="flex items-center space-x-1 hover:underline">
                <CalendarDays className="h-5 w-5" />
                <span>Agendamento</span>
              </Link>
            </li>
            {/* Outros links de navegação podem ser adicionados aqui */}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;