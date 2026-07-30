import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import { type CatalogProduct } from "../lib/catalog-mode";
import {
  CATALOG_CART_INITIAL_STATE,
  type CatalogCartItem,
  catalogCartReducer,
  getCatalogCartCount,
  getCatalogCartTotal,
} from "../lib/catalog-cart";

type CatalogCartContextValue = {
  items: CatalogCartItem[];
  count: number;
  total: number;
  addItem: (product: CatalogProduct, mods?: string[], upgrades?: { id: string; name: string; price: number; qty: number }[]) => void;
  setQty: (cartItemId: string, qty: number) => void;
  removeItem: (cartItemId: string) => void;
  clear: () => void;
};

const CatalogCartContext = createContext<CatalogCartContextValue | null>(null);

export function CatalogCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(catalogCartReducer, CATALOG_CART_INITIAL_STATE);

  const addItem = useCallback((product: CatalogProduct, mods?: string[], upgrades?: { id: string; name: string; price: number; qty: number }[]) => {
    dispatch({ type: "ADD_ITEM", product, mods, upgrades });
  }, []);

  const setQty = useCallback((cartItemId: string, qty: number) => {
    dispatch({ type: "SET_QTY", cartItemId, qty });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    dispatch({ type: "REMOVE_ITEM", cartItemId });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const count = useMemo(() => getCatalogCartCount(state.items), [state.items]);
  const total = useMemo(() => getCatalogCartTotal(state.items), [state.items]);

  const value = useMemo<CatalogCartContextValue>(
    () => ({ items: state.items, count, total, addItem, setQty, removeItem, clear }),
    [state.items, count, total, addItem, setQty, removeItem, clear]
  );

  return <CatalogCartContext.Provider value={value}>{children}</CatalogCartContext.Provider>;
}

export function useCatalogCart(): CatalogCartContextValue {
  const ctx = useContext(CatalogCartContext);
  if (!ctx) throw new Error("useCatalogCart must be used within CatalogCartProvider");
  return ctx;
}
