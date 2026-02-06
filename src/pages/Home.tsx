import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { ChevronRight } from 'lucide-react';
import { getCategories } from '../lib/api';
import ImageWithFallback from '../components/ImageWithFallback';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  accent: string;
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        // Map API data to component format
        const mappedData = data.map((cat: any) => {
           let accent = 'bg-terracotta';
           if (cat.nome === 'Salames') accent = 'bg-wine';
           if (cat.nome === 'Conservas') accent = 'bg-olive';
           
           return {
             id: cat.id,
             name: cat.nome,
             slug: cat.nome, // Simple slug
             description: cat.descricao,
             image: cat.foto_url,
             accent: accent
           };
        });
        setCategories(mappedData);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCats();
  }, []);

  return (
    <Layout>
      <div className="text-center py-8 animate-slide-up">
        <span className="text-olive text-sm tracking-[0.2em] uppercase mb-2 block font-medium">Bem-vindo à</span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-wine mb-2">Mediterranea</h2>
        <p className="text-warm-grey font-light italic text-lg">Pizzeria Siciliana</p>
        <div className="w-24 h-[1px] bg-terracotta/30 mx-auto mt-6"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-4xl mx-auto px-2">
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
