import { type CatalogProduct } from "./catalog-mode";

export const CATALOG_CART_MAX_QTY = 10;

export type CatalogCartUpgrade = { id: string; name: string; price: number; qty: number };

export type CatalogComboSide = { sku: string; name: string; upcharge: number };

export type CatalogComboBurger = {
  sku: string;
  name: string;
  removedIngredients: string[];
  extras: CatalogCartUpgrade[];
  burgerNote?: string;
};

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
  upgrades?: CatalogCartUpgrade[];
  comboSide?: CatalogComboSide;
  comboBurgers?: CatalogComboBurger[];
};

export type CatalogCartState = {
  items: CatalogCartItem[];
};

export type CatalogCartAction =
  | { type: "ADD_ITEM"; product: CatalogProduct; mods?: string[]; upgrades?: CatalogCartUpgrade[]; comboSide?: CatalogComboSide; comboBurgers?: CatalogComboBurger[] }
  | { type: "UPDATE_ITEM"; oldCartItemId: string; product: CatalogProduct; mods?: string[]; upgrades?: CatalogCartUpgrade[]; comboSide?: CatalogComboSide; comboBurgers?: CatalogComboBurger[] }
  | { type: "SET_QTY"; cartItemId: string; qty: number }
  | { type: "REMOVE_ITEM"; cartItemId: string }
  | { type: "SET_ITEMS"; items: CatalogCartItem[] }
  | { type: "CLEAR" };

const buildCartItemKey = (productId: string, mods?: string[], upgrades?: CatalogCartUpgrade[], comboSide?: CatalogComboSide, comboBurgers?: CatalogComboBurger[]) => {
  const modsKey = mods?.length ? `|m:${mods.join(",")}` : "";
  const upgradesKey = upgrades?.length ? `|u:${upgrades.map(u => `${u.id}:${u.qty}`).join(",")}` : "";
  const comboSideKey = comboSide ? `|s:${comboSide.sku}:${comboSide.upcharge}` : "";
  const comboBurgersKey = comboBurgers?.length
    ? `|cb:${comboBurgers.map(b => `${b.sku}[${b.removedIngredients.join(",")};${b.extras.map(e => `${e.id}:${e.qty}`).join(",")};${b.burgerNote ?? ""}]`).join("|")}`
    : "";
  return `${productId}${modsKey}${upgradesKey}${comboSideKey}${comboBurgersKey}`;
};

export const CATALOG_CART_INITIAL_STATE: CatalogCartState = { items: [] };

export function catalogCartReducer(
  state: CatalogCartState,
  action: CatalogCartAction
): CatalogCartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const cartItemId = buildCartItemKey(action.product.id, action.mods, action.upgrades, action.comboSide, action.comboBurgers);
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
        comboSide: action.comboSide,
        comboBurgers: action.comboBurgers,
      };
      return { items: [...state.items, newItem] };
    }

    case "UPDATE_ITEM": {
      const newCartItemId = buildCartItemKey(action.product.id, action.mods, action.upgrades, action.comboSide, action.comboBurgers);
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
        comboSide: action.comboSide,
        comboBurgers: action.comboBurgers,
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

export function getCatalogCartItemUnitTotal(item: CatalogCartItem): number {
  const upgradesTotal = item.upgrades?.reduce((uSum, u) => uSum + u.price * u.qty, 0) || 0;
  const burgerExtrasTotal =
    item.comboBurgers?.reduce(
      (bSum, burger) => bSum + (burger.extras?.reduce((eSum, e) => eSum + e.price * e.qty, 0) || 0),
      0
    ) || 0;
  const sideUpcharge = item.comboSide?.upcharge || 0;
  return item.price + upgradesTotal + burgerExtrasTotal + sideUpcharge;
}

export function getCatalogCartItemTotal(item: CatalogCartItem): number {
  return getCatalogCartItemUnitTotal(item) * item.qty;
}

export function getCatalogCartTotal(items: CatalogCartItem[]): number {
  return items.reduce((sum, item) => sum + getCatalogCartItemTotal(item), 0);
}
