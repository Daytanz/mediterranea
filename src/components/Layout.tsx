import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cart = useStore((state) => state.cart);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Top Line */}
      <div className="h-1 bg-gradient-to-r from-terracotta via-wine to-olive w-full" />

      {/* Header */}
      <header className={`sticky top-0 z-20 transition-all duration-300 ${isHome ? 'bg-cream/90 backdrop-blur-sm' : 'bg-cream shadow-sm'}`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex flex-col items-start group">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-wine tracking-wide group-hover:scale-105 transition-transform duration-300">
              Mediterranea
            </h1>
            {!isHome && <span className="text-xs text-olive tracking-widest uppercase mt-1">Pizzeria Siciliana</span>}
          </Link>
          
          <Link to="/carrinho" className="relative p-2 group transition-transform hover:scale-105">
            <ShoppingBag className="w-6 h-6 text-warm-black stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-terracotta text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm animate-fade-in">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-10 animate-fade-in">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="mt-auto py-12 px-6 bg-sand border-t border-terracotta/10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-[1px] bg-terracotta/30" />
          <h2 className="font-serif text-xl text-wine">Mediterranea</h2>
          <p className="text-warm-grey text-sm font-light max-w-xs mx-auto">
            Autentica tradizione siciliana, ingredienti scelti e amore per la cucina.
          </p>
          <div className="flex gap-4 mt-2">
            <div className="w-2 h-2 rounded-full bg-olive/40" />
            <div className="w-2 h-2 rounded-full bg-terracotta/40" />
            <div className="w-2 h-2 rounded-full bg-wine/40" />
          </div>
          <p className="text-xs text-warm-grey/60 mt-8">
            &copy; {new Date().getFullYear()} Mediterranea Pizzeria. <Link to="/admin" className="hover:text-wine transition-colors">Admin</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
