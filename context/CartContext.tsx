import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Định nghĩa key lưu trữ
const CART_STORAGE_KEY = 'user_cart_storage';

// Định nghĩa kiểu dữ liệu cho sản phẩm trong giỏ
export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // 1. Load giỏ hàng từ AsyncStorage khi ứng dụng khởi động
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          setItems(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error('Lỗi khi tải giỏ hàng:', error);
      }
    };
    loadCart();
  }, []);

  // Hàm hỗ trợ lưu xuống Storage
  const saveCartToStorage = async (newItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('Lỗi khi lưu giỏ hàng:', error);
    }
  };

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === product.id);
      let newItems;
      
      if (existingItem) {
        newItems = prevItems.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [...prevItems, { ...product, quantity: 1 }];
      }
      
      // Lưu xuống máy ngay lập tức
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const removeFromCart = (id: number) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== id);
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prevItems) => {
      const newItems = prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    const newItems: CartItem[] = [];
    setItems(newItems);
    saveCartToStorage(newItems);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}