import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';

const KEY = 'cart_state';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const prevUserRef = useRef(null);

  // Restore cart on cold start (before the user check runs)
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setItems(parsed);
        }
      } catch {
        // Corrupt cache — start fresh
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist cart on every change (after hydrate so we don't
  // overwrite the cache with the initial empty array)
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        if (items.length === 0) {
          await SecureStore.deleteItemAsync(KEY);
        } else {
          await SecureStore.setItemAsync(KEY, JSON.stringify(items));
        }
      } catch {
        // Best-effort persistence
      }
    })();
  }, [items, hydrated]);

  // Clear cart when the user logs out
  useEffect(() => {
    if (!user && prevUserRef.current) {
      setItems([]);
      SecureStore.deleteItemAsync(KEY).catch(() => {});
    }
    prevUserRef.current = user;
  }, [user]);

  const addToCart = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQty = (productId, quantity) => {
    if (quantity <= 0) return removeItem(productId);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  };

  const removeItem = (productId) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const clearCart = () => setItems([]);

  const { subtotal, tax, total, count } = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const t = +(sub * 0.08).toFixed(2);
    return {
      subtotal: +sub.toFixed(2),
      tax: t,
      total: +(sub + t).toFixed(2),
      count: items.reduce((s, i) => s + i.quantity, 0),
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        subtotal,
        tax,
        total,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};