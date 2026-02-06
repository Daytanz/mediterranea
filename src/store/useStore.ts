import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: number;
  nome: string;
  descricao: string;
  preco_inteiro: number;
  preco_meia?: number;
  foto_url: string;
  categoria_id: number;
  quantidade_estoque?: number;
  unidade?: string;
  ativo: boolean;
}

export interface CartItem {
  cartId: string; // Unique ID for cart item
  product: Product;
  type: 'inteira' | 'meia';
  quantity: number;
  meias?: string[]; // Names of half pizza flavors
}

interface StoreState {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  updateQuantity: (cartId: string, quantity: number) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (item) => set((state) => {
        // Clone cart
        let newCart = [...state.cart];
        
        // Check if same item exists (same product + same type)
        const existingItemIndex = newCart.findIndex(
          (i) => i.product.id === item.product.id && i.type === item.type
        );

        if (existingItemIndex > -1) {
          // Update quantity
          newCart[existingItemIndex].quantity += item.quantity;
        } else {
          // Add new item
          newCart.push(item);
        }

        // AUTO-CONVERSION LOGIC: 2 Meias (Same Flavor) -> 1 Inteira
        if (item.type === 'meia' && item.product.categoria_id === 1) {
          const meiaIndex = newCart.findIndex(i => i.product.id === item.product.id && i.type === 'meia');
          
          if (meiaIndex > -1) {
            const meiaItem = newCart[meiaIndex];
            if (meiaItem.quantity >= 2) {
              const pairs = Math.floor(meiaItem.quantity / 2);
              const remainder = meiaItem.quantity % 2;

              // Reduce meias
              if (remainder === 0) {
                newCart.splice(meiaIndex, 1);
              } else {
                newCart[meiaIndex].quantity = remainder;
              }

              // Add/Increase inteiras
              const inteiraIndex = newCart.findIndex(i => i.product.id === item.product.id && i.type === 'inteira');
              if (inteiraIndex > -1) {
                newCart[inteiraIndex].quantity += pairs;
              } else {
                newCart.push({
                  ...meiaItem,
                  cartId: item.cartId, // Keep latest ID or generate new one? Doesn't matter much for display
                  type: 'inteira',
                  quantity: pairs,
                  meias: [] // Inteira doesn't have "meias" array in this context
                });
              }
            }
          }
        }

        return { cart: newCart };
      }),
      removeFromCart: (cartId) =>
        set((state) => ({ cart: state.cart.filter((i) => i.cartId !== cartId) })),
      clearCart: () => set({ cart: [] }),
      updateQuantity: (cartId, quantity) =>
        set((state) => {
          let newCart = state.cart.map((i) =>
            i.cartId === cartId ? { ...i, quantity } : i
          );
          
          // Apply conversion logic again if we updated a Meia
          const updatedItem = newCart.find(i => i.cartId === cartId);
          if (updatedItem && updatedItem.type === 'meia' && updatedItem.product.categoria_id === 1) {
             const productId = updatedItem.product.id;
             const meiaItem = updatedItem; // This is the one we just updated
             
             if (meiaItem.quantity >= 2) {
                const pairs = Math.floor(meiaItem.quantity / 2);
                const remainder = meiaItem.quantity % 2;

                // Update Meia
                if (remainder === 0) {
                  newCart = newCart.filter(i => i.cartId !== cartId);
                } else {
                  meiaItem.quantity = remainder;
                }

                // Update/Add Inteira
                const inteiraIndex = newCart.findIndex(i => i.product.id === productId && i.type === 'inteira');
                if (inteiraIndex > -1) {
                  newCart[inteiraIndex].quantity += pairs;
                } else {
                  // Need a new ID for the new inteira item if it didn't exist
                  // In a real app, uuidv4() should be imported or passed. 
                  // For now we reuse the ID suffix or just rely on the fact that 'cartId' is unique.
                  // Let's assume we can generate a simple one or we need to import uuid.
                  // Since we can't easily import uuid inside the store file without changing imports,
                  // we will append a timestamp to the original ID.
                  newCart.push({
                    ...meiaItem,
                    cartId: `${meiaItem.cartId}-converted-${Date.now()}`,
                    type: 'inteira',
                    quantity: pairs,
                    meias: []
                  });
                }
             }
          }
          
          return { cart: newCart };
        }),
    }),
    {
      name: 'mediterranea-storage',
    }
  )
);
