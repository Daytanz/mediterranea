import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { ChevronRight, Calendar } from 'lucide-react';
import { getCategories, getEventos } from '../lib/api';
import ImageWithFallback from '../components/ImageWithFallback';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  accent: string;
}

interface Evento {
  id: number;
  titulo: string;
  descricao: string;
  data_hora: string;
  foto_url: string;
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nextEvent, setNextEvent] = useState<Evento | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      const start = performance.now();
      try {
        const catsData = await getCategories();
        
        const mappedData = catsData.map((cat: any) => {
           let accent = 'bg-terracotta';
           if (cat.nome === 'Salames') accent = 'bg-wine';
           if (cat.nome === 'Conservas') accent = 'bg-olive';
           
           return {
             id: cat.id,
             name: cat.nome,
             slug: cat.nome,
             description: cat.descricao,
             image: cat.foto_url,
             accent: accent
           };
        });

        if (!cancelled) setCategories(mappedData);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      } finally {
        const elapsed = Math.round(performance.now() - start);
        console.log('[timing] home /api/categorias ms=', elapsed);
      }
    };

    const fetchEventos = async () => {
      const start = performance.now();
      try {
        const evtsData = await getEventos();
        if (!cancelled && evtsData && evtsData.length > 0) {
          setNextEvent(evtsData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch eventos", err);
      } finally {
        const elapsed = Math.round(performance.now() - start);
        console.log('[timing] home /api/eventos ms=', elapsed);
      }
    };

    fetchCategories();
    fetchEventos();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>
      <div className="text-center py-8 animate-slide-up">
        <span className="text-olive text-sm tracking-[0.2em] uppercase mb-2 block font-medium">Bem-vindo à</span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-wine mb-2">Mediterranea</h2>
        <p className="text-warm-grey font-light italic text-lg">Pizzeria Siciliana</p>
        <div className="w-24 h-[1px] bg-terracotta/30 mx-auto mt-6"></div>
      </div>

      {/* Next Event Section */}
      {nextEvent && (
        <div className="max-w-4xl mx-auto px-4 mt-8 animate-fade-in delay-200">
          <div className="text-center mb-6">
            <span className="text-terracotta text-sm tracking-[0.2em] uppercase font-bold">Próximo Evento</span>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-zinc-100 flex flex-col md:flex-row transition-transform hover:shadow-lg">
            <div className="h-56 md:h-auto md:w-2/5 bg-zinc-200 relative shrink-0">
              <ImageWithFallback 
                src={nextEvent.foto_url} 
                alt={nextEvent.titulo}
                className="w-full h-full object-cover"
                fallbackSrc="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"
              />
            </div>
            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-zinc-800 mb-3">{nextEvent.titulo}</h2>
              <div className="flex items-center gap-2 text-terracotta font-medium mb-4 bg-orange-50 w-fit px-3 py-1.5 rounded-full text-sm">
                <Calendar size={16} />
                {nextEvent.data_hora}
              </div>
              <p className="text-zinc-600 mb-6 line-clamp-3">{nextEvent.descricao}</p>
              
              <div className="mt-auto flex flex-col sm:flex-row gap-3">
                <Link 
                  to="/eventos"
                  className="flex-1 bg-olive text-white px-6 py-3 rounded-xl font-bold hover:bg-olive/90 transition-colors text-center shadow-sm"
                >
                  Quero Participar
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-8 mb-12 text-center">
            <Link to="/eventos" className="inline-flex items-center gap-2 text-wine font-bold hover:text-terracotta transition-colors">
              Ver todos os eventos <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="text-center mb-6 mt-12">
        <span className="text-zinc-500 text-sm tracking-[0.2em] uppercase font-bold">Nosso Cardápio</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto px-2">
        {categories.map((cat, index) => (
          <Link
            key={cat.id}
            to={`/categoria/${cat.slug}`}
            className={`
              group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-500
              animate-slide-up
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-warm-black/20 group-hover:bg-warm-black/10 transition-colors z-10" />
            
            <div className="h-48 md:h-64 overflow-hidden bg-zinc-200">
              <ImageWithFallback 
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
              />
            </div>
            
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 bg-gradient-to-t from-warm-black/80 via-warm-black/40 to-transparent">
              <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-2xl font-serif font-bold text-cream mb-1 flex items-center gap-2">
                  {cat.name}
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300" />
                </h3>
                <p className="text-cream/90 text-sm font-light tracking-wide">{cat.description}</p>
              </div>
            </div>
            
            {/* Decorative accent line */}
            <div className={`absolute bottom-0 left-0 w-full h-1 ${cat.accent} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-30`} />
          </Link>
        ))}
      </div>
      
      {/* Remove redundant event link at bottom since it's at the top now */}
      <div className="mt-16 text-center animate-fade-in delay-300">
        <div className="inline-block p-4 border border-olive/20 rounded-lg bg-white/50 backdrop-blur-sm">
          <p className="text-olive text-sm font-serif italic">
            "O verdadeiro sabor da Sicília, direto na sua casa."
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
