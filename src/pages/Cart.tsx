import React, { useMemo, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useStore } from '../store/useStore';
import { Trash2, ArrowLeft, MessageCircle, Plus, Minus, Clock, Lock } from 'lucide-react';
import { createOrder, getAdminConfigs } from '../lib/api';
import { Link } from 'react-router-dom';

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart, updateQuantity } = useStore();
  const [shopStatus, setShopStatus] = useState<{ isOpen: boolean; message: string }>({ isOpen: true, message: '' });
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const checkShopStatus = async () => {
      try {
        const configs = await getAdminConfigs();
        const configMap: Record<string, string> = {};
        configs.forEach((c: any) => configMap[c.chave] = c.valor);

        const status = configMap['shop_status'] || 'auto';
        
        if (status === 'open') {
          setShopStatus({ isOpen: true, message: '' });
        } else if (status === 'closed') {
          setShopStatus({ isOpen: false, message: configMap['closing_msg'] || 'Fechado temporariamente.' });
        } else {
          // Auto logic
          const now = new Date();
          const currentDay = now.getDay(); // 0=Sun
          const currentHour = now.getHours();

          const openDay = parseInt(configMap['schedule_open_day'] || '4'); // Default Thu
          const openHour = parseInt(configMap['schedule_open_hour'] || '8');
          const closeDay = parseInt(configMap['schedule_close_day'] || '4');
          const closeHour = parseInt(configMap['schedule_close_hour'] || '16');

          // Simple logic: Assuming weekly cycle.
          // Since user said "Open Thursday morning -> Close Thursday 16:00", this is a window within the week.
          // We need to check if NOW is inside the [OpenTime, CloseTime] window.
          
          // Let's normalize everything to "minutes from start of week" for easy comparison?
          // Or just simple checks if start/end days are same or different.
          
          // Case 1: Same day window (e.g. Thu 08:00 to Thu 16:00)
          let isOpen = false;
          
          if (openDay === closeDay) {
            if (currentDay === openDay) {
              if (currentHour >= openHour && currentHour < closeHour) {
                isOpen = true;
              }
            }
          } 
          // Case 2: Multi-day window (e.g. Thu 08:00 to Fri 16:00)
          else if (closeDay > openDay) {
             if (currentDay > openDay && currentDay < closeDay) {
               isOpen = true;
             } else if (currentDay === openDay && currentHour >= openHour) {
               isOpen = true;
             } else if (currentDay === closeDay && currentHour < closeHour) {
               isOpen = true;
             }
          }
          // Case 3: Wrapping week (e.g. Fri to Mon) - Not implemented for simplicity unless requested, assume standard week.

          // Message logic
          let msg = '';
          if (!isOpen) {
             // If before opening
             if (currentDay < openDay || (currentDay === openDay && currentHour < openHour)) {
               msg = configMap['opening_msg'] || 'Aguarde a abertura dos pedidos.';
             } else {
               msg = configMap['closing_msg'] || 'Pedidos encerrados.';
             }
          }

          setShopStatus({ isOpen, message: msg });
        }
      } catch (err) {
        console.error(err);
        // Fallback to open in case of error to not block business
        setShopStatus({ isOpen: true, message: '' });
      } finally {
        setLoadingStatus(false);
      }
    };
    
    checkShopStatus();
  }, []);

  const validation = useMemo(() => {
    const pizzas = cart.filter(i => i.product.categoria_id === 1);
    const wholePizzasCount = pizzas.filter(i => i.type === 'inteira').reduce((acc, i) => acc + i.quantity, 0);
    const halfPizzasCount = pizzas.filter(i => i.type === 'meia').reduce((acc, i) => acc + i.quantity, 0);
    
    // Total equivalent pizzas (1 whole = 1, 2 halves = 1)
    const totalPizzaEquivalent = wholePizzasCount + (halfPizzasCount / 2);

    const errors = [];
    if (totalPizzaEquivalent < 1) errors.push("O pedido deve conter pelo menos uma pizza inteira (ou duas metades)");
    if (halfPizzasCount % 2 !== 0) errors.push("Selecione outra metade para completar a pizza (número ímpar de meias)");
    
    return { valid: errors.length === 0, errors };
  }, [cart]);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.type === 'inteira' ? item.product.preco_inteiro : (item.product.preco_meia || 0);
      return acc + (price * item.quantity);
    }, 0);
  }, [cart]);

  const handleSendOrder = async () => {
    if (!validation.valid) return;

    const orderData = {
      items: cart.map(i => ({
        produto_id: i.product.id,
        tipo: i.type,
        quantidade: i.quantity,
        meias: i.meias,
        preco_unitario: i.type === 'inteira' ? i.product.preco_inteiro : i.product.preco_meia
      })),
      total: total,
      whatsapp: '5511999999999'
    };

    try {
      await createOrder(orderData);
      
      const message = formatWhatsAppMessage();
      const whatsappNumber = '5511999999999';
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      
      clearCart();
    } catch (err) {
      alert('Erro ao processar pedido. Tente novamente.');
      console.error(err);
    }
  };

  const formatWhatsAppMessage = () => {
    let msg = `*Olá! Gostaria de fazer um pedido:*\n\n`;
    
    const pizzas = cart.filter(i => i.product.categoria_id === 1);
    const others = cart.filter(i => i.product.categoria_id !== 1);

    if (pizzas.length > 0) {
      msg += `🍕 *PIZZAS*\n`;
      pizzas.forEach(p => {
        const typeLabel = p.type === 'inteira' ? 'Inteira' : 'Meia';
        msg += `${p.quantity}x ${typeLabel}: ${p.product.nome}\n`;
      });
    }
    
    if (others.length > 0) {
      msg += `\n📦 *OUTROS ITENS*\n`;
      others.forEach(p => msg += `${p.quantity}x ${p.product.nome}\n`);
    }

    msg += `\n*Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
    return msg;
  };

  if (cart.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
          <div className="w-20 h-20 bg-sand rounded-full flex items-center justify-center mb-6">
            <MessageCircle size={32} className="text-terracotta opacity-50" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-wine mb-2">Seu carrinho está vazio</h2>
          <p className="text-warm-grey mb-8 font-light">Você ainda não escolheu nossas especialidades.</p>
          <Link to="/" className="bg-terracotta text-white px-8 py-3 rounded-full font-medium hover:bg-wine transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1">
            Ver o Menu
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto animate-fade-in pb-32">
        <div className="flex items-center gap-4 mb-8">
           <Link to="/" className="text-warm-grey hover:text-wine transition-colors">
             <ArrowLeft size={24} />
           </Link>
           <h2 className="text-3xl font-serif font-bold text-wine">Seu Pedido</h2>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-sand overflow-hidden relative">
           {/* Decorative paper texture overlay */}
           <div className="absolute inset-0 bg-texture-paper opacity-50 pointer-events-none"></div>
           
           <div className="divide-y divide-sand relative z-10">
            {cart.map((item) => (
              <div key={item.cartId} className="p-6 flex flex-col sm:flex-row justify-between items-center hover:bg-cream/30 transition-colors gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-serif font-bold text-lg text-warm-black">{item.product.nome}</h3>
                  <p className="text-sm text-olive uppercase tracking-wide font-medium mt-1">
                    {item.type === 'inteira' ? 'Pizza Inteira' : 'Meia Pizza'}
                  </p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 bg-sand/50 rounded-lg p-1">
                    <button 
                      onClick={() => item.quantity > 1 ? updateQuantity(item.cartId, item.quantity - 1) : removeFromCart(item.cartId)}
                      className="p-1 text-warm-grey hover:text-wine hover:bg-white rounded-md transition-all"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-serif font-bold text-warm-black w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                      className="p-1 text-warm-grey hover:text-wine hover:bg-white rounded-md transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <span className="font-medium text-terracotta min-w-[80px] text-right">
                    R$ {(item.quantity * (item.type === 'inteira' ? item.product.preco_inteiro : (item.product.preco_meia || 0))).toFixed(2).replace('.', ',')}
                  </span>
                  
                  <button 
                    onClick={() => removeFromCart(item.cartId)}
                    className="text-warm-grey/50 hover:text-wine p-2 rounded-full hover:bg-wine/10 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-sand/30 p-6 border-t border-sand relative z-10">
             <div className="flex justify-between items-center">
               <span className="font-serif text-xl text-warm-black">Total</span>
               <span className="font-serif text-2xl font-bold text-wine">R$ {total.toFixed(2).replace('.', ',')}</span>
             </div>
          </div>
        </div>

        {/* Floating Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-sand p-4 pb-8 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-40">
          <div className="container mx-auto max-w-2xl">
            {validation.errors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl text-sm animate-slide-up">
                {validation.errors.map((err, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {err}
                  </div>
                ))}
              </div>
            )}
            
            {!loadingStatus && !shopStatus.isOpen ? (
              <div className="w-full bg-zinc-100 text-zinc-500 font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-not-allowed border-2 border-dashed border-zinc-200 p-6">
                <div className="flex items-center gap-2 text-red-500">
                  <Lock size={24} />
                  <span className="text-lg">Pedidos Fechados</span>
                </div>
                <p className="text-sm font-normal text-center max-w-xs">{shopStatus.message}</p>
                <div className="text-xs mt-2 bg-white px-3 py-1 rounded-full border border-zinc-200 text-zinc-400 flex items-center gap-1 text-center">
                  <Clock size={12} />
                  Pedidos: Quinta (07h-16h) para entrega Sexta à noite
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl text-sm flex flex-col items-center justify-center gap-1 text-center animate-fade-in">
                   <div className="flex items-center gap-2 font-bold">
                     <Clock size={16} />
                     <span>Agendamento para Sexta-feira</span>
                   </div>
                   <p className="text-xs opacity-90">Você está realizando um pedido para sexta-feira à noite.</p>
                </div>
                
                <button
                  onClick={handleSendOrder}
                  disabled={!validation.valid || loadingStatus}
                  className="w-full bg-olive text-white font-bold py-4 rounded-xl hover:bg-olive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                >
                  <span>Fazer Pedido no WhatsApp</span>
                  <MessageCircle size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
