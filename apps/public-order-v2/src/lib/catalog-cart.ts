import { type CatalogProduct } from "./catalog-mode";

export const CATALOG_CART_MAX_QTY = 10;

export type CatalogCartItem = {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  type: CatalogProduct["type"];
  qty: number;
  imageUrl?: string;
  imageKey?: string;
  mods?: string[];
  upgrades?: { id: string; name: string; price: number; qty: number }[];
};

export type CatalogCartState = {
  items: CatalogCartItem[];
};

export type CatalogCartAction =
  | { type: "ADD_ITEM"; product: CatalogProduct; mods?: string[]; upgrades?: { id: string; name: string; price: number; qty: number }[] }
  | { type: "UPDATE_ITEM"; oldCartItemId: string; product: CatalogProduct; mods?: string[]; upgrades?: { id: string; name: string; price: number; qty: number }[] }
  | { type: "SET_QTY"; cartItemId: string; qty: number }
  | { type: "REMOVE_ITEM"; cartItemId: string }
  | { type: "SET_ITEMS"; items: CatalogCartItem[] }
  | { type: "CLEAR" };

export const CATALOG_CART_INITIAL_STATE: CatalogCartState = { items: [] };

export function catalogCartReducer(
  state: CatalogCartState,
  action: CatalogCartAction
): CatalogCartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const modsKey = action.mods?.length ? `|m:${action.mods.join(",")}` : "";
      const upgradesKey = action.upgrades?.length ? `|u:${action.upgrades.map(u => `${u.id}:${u.qty}`).join(",")}` : "";
      const cartItemId = `${action.product.id}${modsKey}${upgradesKey}`;
      const existing = state.items.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, qty: Math.min(item.qty + 1, CATALOG_CART_MAX_QTY) }
              : item
          ),
        };
      }
      const newItem: CatalogCartItem = {
        cartItemId,
        productId: action.product.id,
        name: action.product.name,
        price: action.product.price,
        type: action.product.type,
        qty: 1,
        imageUrl: action.product.imageUrl,
        imageKey: action.product.imageKey,
        mods: action.mods,
        upgrades: action.upgrades,
      };
      return { items: [...state.items, newItem] };
    }

    case "UPDATE_ITEM": {
      const modsKey = action.mods?.length ? `|m:${action.mods.join(",")}` : "";
      const upgradesKey = action.upgrades?.length ? `|u:${action.upgrades.map(u => `${u.id}:${u.qty}`).join(",")}` : "";
      const newCartItemId = `${action.product.id}${modsKey}${upgradesKey}`;
      const oldItem = state.items.find(i => i.cartItemId === action.oldCartItemId);
      const currentQty = oldItem ? oldItem.qty : 1;

      // Filter out old item
      const filtered = state.items.filter(i => i.cartItemId !== action.oldCartItemId);
      const newItem: CatalogCartItem = {
        cartItemId: newCartItemId,
        productId: action.product.id,
        name: action.product.name,
        price: action.product.price,
        type: action.product.type,
        qty: currentQty,
        imageUrl: action.product.imageUrl,
        imageKey: action.product.imageKey,
        mods: action.mods,
        upgrades: action.upgrades,
      };
      return { items: [...filtered, newItem] };
    }

    case "SET_QTY": {
      if (action.qty <= 0) {
        return { items: state.items.filter((item) => item.cartItemId !== action.cartItemId) };
      }
      return {
        items: state.items.map((item) =>
          item.cartItemId === action.cartItemId ? { ...item, qty: Math.min(action.qty, CATALOG_CART_MAX_QTY) } : item
        ),
      };
    }

    case "REMOVE_ITEM": {
      return { items: state.items.filter((item) => item.cartItemId !== action.cartItemId) };
    }
    case "SET_ITEMS": {
      return { items: action.items };
    }
    case "CLEAR":
      return CATALOG_CART_INITIAL_STATE;

    default:
      return state;
  }
}

export function getCatalogCartCount(items: CatalogCartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function getCatalogCartTotal(items: CatalogCartItem[]): number {
  return items.reduce((sum, item) => {
    const upgradesTotal = item.upgrades?.reduce((uSum, u) => uSum + u.price * u.qty, 0) || 0;
    return sum + (item.price + upgradesTotal) * item.qty;
  }, 0);
}
