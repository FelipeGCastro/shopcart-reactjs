import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // localStorage.clear()
    const storagedCart =  localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);
      const { data: stock } = await api.get('/stock/' + productId)
      if (productIndex < 0) {
        const { data } = await api.get('/products/' + productId)
        data.amount = 1
        if (data.amount > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return 
        }
        setCart([...cart, data])
        await localStorage.setItem('@RocketShoes:cart', JSON.stringify(data))
      } else {
        if (cart[productIndex].amount + 1 > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }
        const copyCart = cart
        copyCart.splice(productIndex,1, {...cart[productIndex], amount: cart[productIndex].amount + 1} )
        setCart([...copyCart])
        await localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart))
      }
      
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);
      const copyCart = cart
        copyCart.splice(productIndex,1)
        setCart([...copyCart])
        await localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) return
    try {
      const productIndex = cart.findIndex(product => product.id === productId);
      const { data: stock } = await api.get('/stock/' + productId)
      if (amount > stock.amount){
        toast.error('Quantidade solicitada fora de estoque');
         return 
        }
      const copyCart = cart
        copyCart.splice(productIndex,1, {...cart[productIndex], amount } )
        setCart([...copyCart])
        await localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
