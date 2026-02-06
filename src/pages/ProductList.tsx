import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getProducts } from '../lib/api';
import { Product, useStore } from '../store/useStore';
import { Plus, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ProductList: React.FC = () => {
  const { nome } = useParams<{ nome: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useStore((state) => state.addToCart);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        const catMap: Record<string, number> = {
          'Pizzas': 1, 'Salames': 2, 'Conservas': 3, 'Sobremesas': 4
        };
        const catId = catMap[nome || ''] || 0;
        setProducts(data.filter((p: Product) => p.categoria_id === catId));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [nome]);

  const handleAdd = (product: Product, type: 'inteira' | 'meia' = 'inteira') => {
    addToCart({
      cartId: uuidv4(),
      product,
      type,
      quantity: 1,
      meias: type === 'meia' ? [product.nome] : []
    });
    // Optional: Add a subtle toast notification here in a real app
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="mb-8 animate-fade-in">
        <Link to="/" className="inline-flex items-center text-warm-grey hover:text-wine transition-colors text-sm mb-4 group">
          <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> 
          Voltar ao menu
        </Link>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-wine capitalize border-b border-terracotta/20 pb-4">
          {nome}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((product, index) => (
          <div 
            key={product.id} 
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col border border-sand animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Image Section */}
            <div className="h-56 relative overflow-hidden bg-sand">
               <img 
                 src={product.foto_url.startsWith('http') ? product.foto_url : `http://localhost:5001${product.foto_url}`} 
                 alt={product.nome} 
                 className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-warm-black/30 to-transparent opacity-60"></div>
               
               {product.quantidade_estoque === 0 && (
                 <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                   <span className="font-serif text-xl text-warm-grey italic border border-warm-grey px-4 py-2">Esgotado</span>
                 </div>
               )}
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-1 relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-serif font-bold text-warm-black group-hover:text-wine transition-colors">
                  {product.nome}
                </h3>
                <span className="font-serif font-bold text-lg text-terracotta whitespace-nowrap ml-4">
                  R$ {(Number(product.preco_inteiro || 0)).toFixed(2)}
                </span>
              </div>
              
              <p className="text-warm-grey text-sm font-light leading-relaxed mb-6 flex-1">
                {product.descricao}
              </p>
              
              <div className="mt-auto pt-4 border-t border-sand">
                {product.categoria_id === 1 ? (
                   // Pizza Actions
                   <div className="flex flex-col gap-3">
                     <div className="flex gap-3">
                       <button 
                         onClick={() => handleAdd(product, 'meia')}
                         className="flex-1 bg-white border-2 border-sand hover:border-olive/50 text-warm-grey hover:text-olive px-2 py-3 rounded-lg text-sm font-medium transition-all relative overflow-hidden group/btn flex flex-col items-center justify-center gap-1"
                       >
                         <span className="relative z-10 font-serif font-bold text-lg">Meia Pizza</span>
                         <span className="relative z-10 text-sm text-terracotta font-bold">R$ {(Number(product.preco_meia || 0)).toFixed(2).replace('.', ',')}</span>
                       </button>
                       
                       <button 
                         onClick={() => handleAdd(product, 'inteira')}
                         className="flex-1 bg-terracotta text-white border-2 border-terracotta hover:bg-wine hover:border-wine px-2 py-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md"
                       >
                         <span className="font-serif font-bold text-lg">Pizza Inteira</span>
                         <span className="text-sm text-white/90 font-bold">R$ {(Number(product.preco_inteiro || 0)).toFixed(2).replace('.', ',')}</span>
                       </button>
                     </div>
                   </div>
                ) : (
                  // Standard Actions
                  <button 
                    disabled={product.quantidade_estoque === 0}
                    onClick={() => handleAdd(product)}
                    className="w-full bg-olive text-white px-4 py-3 rounded-lg font-medium hover:bg-olive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Adicionar ao pedido</span>
                    <Plus size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ProductList;
