import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import { type CatalogProduct } from "../lib/catalog-mode";
import {
  CATALOG_CART_INITIAL_STATE,
  type CatalogCartItem,
  type CatalogCartUpgrade,
  type CatalogComboBurger,
  type CatalogComboSide,
  catalogCartReducer,
  getCatalogCartCount,
  getCatalogCartTotal,
} from "../lib/catalog-cart";

type CatalogCartContextValue = {
  items: CatalogCartItem[];
  count: number;
  total: number;
  addItem: (product: CatalogProduct, mods?: string[], upgrades?: CatalogCartUpgrade[], comboSide?: CatalogComboSide, comboBurgers?: CatalogComboBurger[]) => void;
  updateItem: (oldCartItemId: string, product: CatalogProduct, mods?: string[], upgrades?: CatalogCartUpgrade[], comboSide?: CatalogComboSide, comboBurgers?: CatalogComboBurger[]) => void;
  setQty: (cartItemId: string, qty: number) => void;
  removeItem: (cartItemId: string) => void;
  setItems: (items: CatalogCartItem[]) => void;
  clear: () => void;
};

const CatalogCartContext = createContext<CatalogCartContextValue | null>(null);

export function CatalogCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(catalogCartReducer, CATALOG_CART_INITIAL_STATE);

  const addItem = useCallback((product: CatalogProduct, mods?: string[], upgrades?: CatalogCartUpgrade[], comboSide?: CatalogComboSide, comboBurgers?: CatalogComboBurger[]) => {
    if (product.isAvailable === false) return;
    dispatch({ type: "ADD_ITEM", product, mods, upgrades, comboSide, comboBurgers });
  }, []);

  const updateItem = useCallback((oldCartItemId: string, product: CatalogProduct, mods?: string[], upgrades?: CatalogCartUpgrade[], comboSide?: CatalogComboSide, comboBurgers?: CatalogComboBurger[]) => {
    dispatch({ type: "UPDATE_ITEM", oldCartItemId, product, mods, upgrades, comboSide, comboBurgers });
  }, []);

  const setQty = useCallback((cartItemId: string, qty: number) => {
    dispatch({ type: "SET_QTY", cartItemId, qty });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    dispatch({ type: "REMOVE_ITEM", cartItemId });
  }, []);

  const setItems = useCallback((items: CatalogCartItem[]) => {
    dispatch({ type: "SET_ITEMS", items });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const count = useMemo(() => getCatalogCartCount(state.items), [state.items]);
  const total = useMemo(() => getCatalogCartTotal(state.items), [state.items]);

  const value = useMemo<CatalogCartContextValue>(
    () => ({ items: state.items, count, total, addItem, updateItem, setQty, removeItem, setItems, clear }),
    [state.items, count, total, addItem, updateItem, setQty, removeItem, setItems, clear]
  );

  return <CatalogCartContext.Provider value={value}>{children}</CatalogCartContext.Provider>;
}

export function useCatalogCart(): CatalogCartContextValue {
  const ctx = useContext(CatalogCartContext);
  if (!ctx) throw new Error("useCatalogCart must be used within CatalogCartProvider");
  return ctx;
}
