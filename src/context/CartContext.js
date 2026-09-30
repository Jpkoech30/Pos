/**
 * CART CONTEXT
 *
 * Holds the in-progress sale for the kiosk. A cashier taps products,
 * each tap adds a line, and the cart bar at the bottom shows the running
 * total in Kenyan Shillings.
 *
 * TAX_RATE is 0 by default — kiosk prices are inclusive.
 */
import React, { createContext, useContext, useReducer, useMemo } from 'react';

const CartContext = createContext(null);

const TAX_RATE = 0;

const initialState = {
  items: [], // [{ product, quantity }]
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product } = action;
      const existing = state.items.find((i) => i.product.id === product.id);

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }

      return { items: [...state.items, { product, quantity: 1 }] };
    }

    case 'DECREMENT': {
      const { productId } = action;
      return {
        items: state.items
          .map((i) =>
            i.product.id === productId
              ? { ...i, quantity: i.quantity - 1 }
              : i
          )
          .filter((i) => i.quantity > 0),
      };
    }

    case 'SET_QUANTITY': {
      const { productId, quantity } = action;
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.product.id !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        ),
      };
    }

    case 'REMOVE': {
      const { productId } = action;
      return { items: state.items.filter((i) => i.product.id !== productId) };
    }

    case 'CLEAR':
      return initialState;

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const derived = useMemo(() => {
    const subtotal = state.items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

    return { subtotal, tax, total, itemCount };
  }, [state.items]);

  const api = {
    items: state.items,
    add: (product) => dispatch({ type: 'ADD', product }),
    decrement: (productId) => dispatch({ type: 'DECREMENT', productId }),
    setQuantity: (productId, quantity) =>
      dispatch({ type: 'SET_QUANTITY', productId, quantity }),
    remove: (productId) => dispatch({ type: 'REMOVE', productId }),
    clear: () => dispatch({ type: 'CLEAR' }),
    ...derived,
  };

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};