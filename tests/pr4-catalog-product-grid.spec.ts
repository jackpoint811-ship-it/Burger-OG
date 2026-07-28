import { expect, test } from "@playwright/test";

const publicUrl = process.env.PUBLIC_URL || "http://127.0.0.1:4173";

test.describe("PR4 - Empirical Stress-Tests: Product Grid & Edge Cases", () => {

  test("EC1 - Missing image fallback SVGs per product type", async ({ page }) => {
    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [
            { id: "c1", key: "burgers", name: "Burgers", sortOrder: 1 },
            { id: "c2", key: "combos", name: "Combos", sortOrder: 2 },
            { id: "c3", key: "guarniciones", name: "Guarniciones", sortOrder: 3 },
            { id: "c4", key: "drinks", name: "Bebidas", sortOrder: 4 },
            { id: "c5", key: "toppings", name: "Toppings", sortOrder: 5 },
          ],
          items: [
            { sku: "b1", category: "burgers", name: "Burger No Img", price: 500, isAvailable: true, sortOrder: 1 },
            { sku: "c1", category: "combos", name: "Combo No Img", price: 800, isAvailable: true, sortOrder: 2 },
            { sku: "g1", category: "guarniciones", name: "Side No Img", price: 300, isAvailable: true, sortOrder: 3 },
            { sku: "d1", category: "drinks", name: "Drink No Img", price: 200, isAvailable: true, sortOrder: 4 },
            { sku: "t1", category: "toppings", name: "Topping No Img", price: 100, isAvailable: true, sortOrder: 5 },
          ],
          promos: [],
          categoryBanners: [],
          catalogBanners: [],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    await page.locator(".catalog-card").first().waitFor({ state: "visible" });

    // Verify all 5 SVG fallback thumbnails exist with their specific type classes
    await expect(page.locator(".catalog-fallback-thumbnail--burger")).toBeVisible();
    await expect(page.locator(".catalog-fallback-thumbnail--combo")).toBeVisible();
    await expect(page.locator(".catalog-fallback-thumbnail--side")).toBeVisible();
    await expect(page.locator(".catalog-fallback-thumbnail--drink")).toBeVisible();
    await expect(page.locator(".catalog-fallback-thumbnail--topping")).toBeVisible();

    // Verify each contains an SVG element
    const icons = page.locator(".catalog-fallback-icon");
    await expect(icons).toHaveCount(5);
  });

  test("EC2 - Product with isFeatured: true but type burger renders Hero Card", async ({ page }) => {
    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [{ id: "c1", key: "burgers", name: "Burgers", sortOrder: 1 }],
          items: [
            {
              sku: "b-featured",
              category: "burgers",
              name: "Featured Burger Hero",
              description: "Burger featuring hero layout",
              price: 650,
              isAvailable: true,
              isFeatured: true,
              sortOrder: 1
            }
          ],
          promos: [],
          categoryBanners: [],
          catalogBanners: [],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    await page.locator(".catalog-card").first().waitFor({ state: "visible" });

    const card = page.locator(".catalog-card");
    await expect(card).toHaveClass(/catalog-card--hero/);
    await expect(page.locator(".catalog-badge--featured")).toBeVisible();
  });

  test("EC3 - Product with isFeatured: false but type combo renders Hero Card", async ({ page }) => {
    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [{ id: "c2", key: "combos", name: "Combos", sortOrder: 1 }],
          items: [
            {
              sku: "combo-unfeatured",
              category: "combos",
              name: "Combo Non-Featured Hero",
              description: "Combo automatically gets hero layout",
              price: 950,
              isAvailable: true,
              isFeatured: false,
              sortOrder: 1
            }
          ],
          promos: [],
          categoryBanners: [],
          catalogBanners: [],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    await page.locator(".catalog-card").first().waitFor({ state: "visible" });

    const card = page.locator(".catalog-card");
    await expect(card).toHaveClass(/catalog-card--hero/);
    await expect(page.locator(".catalog-badge--best-seller")).toBeVisible();
  });

  test("EC4 - Card click vs Quick Add click (stopPropagation test)", async ({ page }) => {
    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [{ id: "c1", key: "burgers", name: "Burgers", sortOrder: 1 }],
          items: [
            {
              sku: "b-std",
              category: "burgers",
              name: "Standard Burger",
              description: "Delicious burger for testing",
              price: 450,
              isAvailable: true,
              isFeatured: false,
              sortOrder: 1
            }
          ],
          promos: [],
          categoryBanners: [],
          catalogBanners: [],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    await page.locator(".catalog-card").first().waitFor({ state: "visible" });

    // Test 1: Click Quick Add button directly -> Cart should update, product drawer should NOT open
    const addBtn = page.locator(".catalog-card__btn-add");
    await addBtn.click();

    // Verify cart count bar appears with 1 item
    const cartBar = page.locator(".catalog-cart-bar");
    await expect(cartBar).toBeVisible();

    // Verify product drawer is NOT open
    const drawer = page.locator(".catalog-drawer");
    await expect(drawer).toHaveCount(0);

    // Test 2: Click card body -> Product drawer SHOULD open
    const cardBody = page.locator(".catalog-card__standard-body");
    await cardBody.click();
    await expect(page.locator(".catalog-drawer")).toBeVisible();
  });

  test("EC4-Keyboard - Keyboard activation of Quick Add button", async ({ page }) => {
    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [{ id: "c1", key: "burgers", name: "Burgers", sortOrder: 1 }],
          items: [
            {
              sku: "b-std-kb",
              category: "burgers",
              name: "Standard Burger KB",
              description: "Testing keyboard activation",
              price: 450,
              isAvailable: true,
              isFeatured: false,
              sortOrder: 1
            }
          ],
          promos: [],
          categoryBanners: [],
          catalogBanners: [],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    await page.locator(".catalog-card").first().waitFor({ state: "visible" });

    const addBtn = page.locator(".catalog-card__btn-add");
    await addBtn.focus();
    await page.keyboard.press("Enter");

    // Check if drawer unexpectedly opened due to keydown bubbling to parent container
    const drawer = page.locator(".catalog-drawer");
    const drawerCount = await drawer.count();
    
    // Log finding: If drawerCount > 0, keydown bubbled to parent div and opened product drawer!
    console.log("[EMPIRICAL FINDING] Keyboard Enter on Quick Add - Drawer Count:", drawerCount);
  });

  test("EC5 - Long title/description text overflow & truncation CSS inspection", async ({ page }) => {
    const longDesc = "Esta es una descripción extremadamente larga creada para probar el truncamiento en dos líneas dentro de la tarjeta de producto. Debería truncarse elegantemente con puntos suspensivos sin romper la maquetación ni desbordar la tarjeta hacia los lados o hacia abajo.";
    const longTitle = "Hamburguesa Ultra Triple Super Megabomba Especial Con Doble Queso Cheddar Y Tocineta Crujiente";

    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [
            { id: "c1", key: "burgers", name: "Burgers", sortOrder: 1 },
            { id: "c2", key: "combos", name: "Combos", sortOrder: 2 }
          ],
          items: [
            {
              sku: "long-hero",
              category: "combos",
              name: longTitle,
              description: longDesc,
              price: 1200,
              isAvailable: true,
              isFeatured: true,
              sortOrder: 1
            },
            {
              sku: "long-std",
              category: "burgers",
              name: longTitle,
              description: longDesc,
              price: 600,
              isAvailable: true,
              isFeatured: false,
              sortOrder: 2
            }
          ],
          promos: [],
          categoryBanners: [],
          catalogBanners: [],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    await page.locator(".catalog-card").first().waitFor({ state: "visible" });

    const heroDesc = page.locator(".catalog-card__hero-desc");
    const heroDescStyle = await heroDesc.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        webkitLineClamp: style.webkitLineClamp,
        overflow: style.overflow
      };
    });

    expect(heroDescStyle.display).toBe("-webkit-box");
    expect(heroDescStyle.webkitLineClamp).toBe("2");
    expect(heroDescStyle.overflow).toBe("hidden");

    const stdDesc = page.locator(".catalog-card__standard-desc");
    const stdDescStyle = await stdDesc.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        webkitLineClamp: style.webkitLineClamp,
        overflow: style.overflow
      };
    });

    expect(stdDescStyle.display).toBe("-webkit-box");
    expect(stdDescStyle.webkitLineClamp).toBe("2");
    expect(stdDescStyle.overflow).toBe("hidden");
  });
});
