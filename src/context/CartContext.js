import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, shop } = useAuth();
  const [items, setItems] = useState([]);
  const prevUserRef = useRef(null);

  // Clear cart when the user logs out
  useEffect(() => {
    if (!user && prevUserRef.current) {
      setItems([]);
    }
    prevUserRef.current = user;
  }, [user]);

  const addToCart = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
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
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (productId) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const clearCart = () => setItems([]);

  // Tax math mirrors orderDb.create in pos-api/src/db/orders.js.
  // If the server formula changes, this must change with it.
  //
  // vat-registered + tax-inclusive (the Kenyan default):
  //   the shelf price already includes VAT, so total = sum of prices
  //   and we back the VAT portion out of the total.
  //
  // vat-registered + tax-exclusive:
  //   prices are pre-tax, VAT is added on top.
  //
  // non-vat shops (including TOT-only shops):
  //   vatRate = 0, so total = subtotal, no tax shown to the customer.
  const totals = useMemo(() => {
    const rawSum = items.reduce((s, i) => s + i.price * i.quantity, 0);

    const vatRegistered = shop?.vatRegistered === true;
    const vatRate = vatRegistered ? Number(shop?.vatRate ?? 16) : 0;
    const taxInclusive = shop?.pricesIncludeVat !== false;

    let net, vat, gross;
    if (taxInclusive && vatRate > 0) {
      gross = +rawSum.toFixed(2);
      vat = +(gross * vatRate / (100 + vatRate)).toFixed(2);
      net = +(gross - vat).toFixed(2);
    } else {
      net = +rawSum.toFixed(2);
      vat = +(net * vatRate / 100).toFixed(2);
      gross = +(net + vat).toFixed(2);
    }

    return {
      subtotal: net,
      tax: vat,
      total: gross,
      count: items.reduce((s, i) => s + i.quantity, 0),
      vatRegistered,
      taxInclusive,
    };
  }, [items, shop]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        ...totals,
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