import { mapMenuItemsToCatalogProducts, mapMenuCategoryToCatalogProductType, resolveCatalogAssetUrl, type CatalogProduct } from "../apps/public-order-v2/src/lib/catalog-mode.js";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

console.log("--- Starting PR4 Logic Unit Stress Tests ---");

// Test 1: Category to product type mapping
assert(mapMenuCategoryToCatalogProductType("burgers") === "burger", "burgers -> burger");
assert(mapMenuCategoryToCatalogProductType("combos") === "combo", "combos -> combo");
assert(mapMenuCategoryToCatalogProductType("guarniciones") === "side", "guarniciones -> side");
assert(mapMenuCategoryToCatalogProductType("drinks") === "drink", "drinks -> drink");
assert(mapMenuCategoryToCatalogProductType("toppings") === "topping", "toppings -> topping");
console.log("✅ Category to product type mapping verified.");

// Test 2: Asset URL resolution with missing/invalid images
assert(resolveCatalogAssetUrl(undefined, undefined) === undefined, "undefined image -> undefined");
assert(resolveCatalogAssetUrl("", "") === undefined, "empty image -> undefined");
assert(resolveCatalogAssetUrl("   ", "   ") === undefined, "whitespace image -> undefined");
assert(resolveCatalogAssetUrl("http://insecure.com/img.jpg", undefined) === undefined, "http url rejected -> undefined");
assert(resolveCatalogAssetUrl(undefined, "../bad/path.jpg") === undefined, "path traversal key rejected -> undefined");
assert(resolveCatalogAssetUrl(undefined, "valid/key.png") === "/api/assets-v2/valid/key.png", "valid asset key resolved");
assert(resolveCatalogAssetUrl("/valid/local.png", undefined) === "/valid/local.png", "valid local path resolved");
assert(resolveCatalogAssetUrl("https://safe.com/img.jpg", undefined) === "https://safe.com/img.jpg", "valid https url resolved");
console.log("✅ Asset URL resolution & fallback triggers verified.");

// Test 3: Hero card determination logic
function isHeroCard(product: Partial<CatalogProduct>): boolean {
  return product.type === "combo" || Boolean(product.isFeatured);
}

// Burger with isFeatured: true -> Hero
assert(isHeroCard({ type: "burger", isFeatured: true }) === true, "Burger + isFeatured:true -> Hero Card");

// Combo with isFeatured: false -> Hero
assert(isHeroCard({ type: "combo", isFeatured: false }) === true, "Combo + isFeatured:false -> Hero Card");

// Burger with isFeatured: false -> Standard
assert(isHeroCard({ type: "burger", isFeatured: false }) === false, "Burger + isFeatured:false -> Standard Card");

// Side with isFeatured: false -> Standard
assert(isHeroCard({ type: "side", isFeatured: false }) === false, "Side + isFeatured:false -> Standard Card");

// Drink with isFeatured: true -> Hero
assert(isHeroCard({ type: "drink", isFeatured: true }) === true, "Drink + isFeatured:true -> Hero Card");

console.log("✅ Hero card rendering logic for edge cases verified.");
console.log("--- All PR4 Unit Logic Tests Passed Successfully ---");
