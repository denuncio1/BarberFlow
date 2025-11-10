import React from 'react';
import { Link } from 'react-router-dom';

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
            <li><Link to="/aper" className="hover:underline">Módulo A.P.E.R.</Link></li>
            {/* <li><Link to="/services" className="hover:underline">Serviços</Link></li>
            <li><Link to="/booking" className="hover:underline">Agendamento</Link></li>
            <li><Link to="/contact" className="hover:underline">Contato</Link></li> */}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;