import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cartId, setCartId] = useState(null);

  // Load persisted cart on mount
  useEffect(() => {
    base44.auth.me().then(async (user) => {
      if (!user) return;
      const carts = await base44.entities.Cart.filter({ created_by: user.email }, "-created_date", 1);
      if (carts.length > 0) {
        setCartId(carts[0].id);
        setItems(carts[0].items || []);
      }
    }).catch(() => {});
  }, []);

  const persist = useCallback(async (newItems, existingCartId) => {
    try {
      const user = await base44.auth.me();
      if (!user) return;
      if (existingCartId) {
        await base44.entities.Cart.update(existingCartId, { items: newItems });
      } else {
        const cart = await base44.entities.Cart.create({ items: newItems });
        setCartId(cart.id);
        return cart.id;
      }
    } catch {}
  }, []);

  const addItem = useCallback((rec, auditName = "") => {
    setItems((prev) => {
      const exists = prev.find((i) => i.name === rec.name);
      if (exists) return prev;
      const newItems = [...prev, { ...rec, audit_name: auditName, added_at: new Date().toISOString() }];
      persist(newItems, cartId);
      return newItems;
    });
    setIsOpen(true);
  }, [cartId, persist]);

  const removeItem = useCallback((name) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.name !== name);
      persist(newItems, cartId);
      return newItems;
    });
  }, [cartId, persist]);

  const clearCart = useCallback(() => {
    setItems([]);
    persist([], cartId);
  }, [cartId, persist]);

  const totalCost = items.reduce((s, i) => s + (i.estimated_monthly_cost || 0), 0);
  const totalSavings = items.reduce((s, i) => s + (i.estimated_savings_opportunity || 0), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, isOpen, setIsOpen, totalCost, totalSavings }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}