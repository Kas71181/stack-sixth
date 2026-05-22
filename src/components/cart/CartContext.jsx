import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((rec, auditName = "") => {
    setItems((prev) => {
      const exists = prev.find((i) => i.name === rec.name);
      if (exists) return prev;
      return [...prev, { ...rec, audit_name: auditName, added_at: new Date().toISOString() }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((name) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

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