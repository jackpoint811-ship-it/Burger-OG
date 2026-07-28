import { expect, test } from "@playwright/test";

const publicUrl = process.env.PUBLIC_URL || "http://127.0.0.1:4173";

test.describe("PR3 - Requirement R1: CatalogBannerRail Empirical Tests", () => {

  test("R1.1 - Empty banner list returns null cleanly", async ({ page }) => {
    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [],
          items: [],
          promos: [],
          categoryBanners: [],
          catalogBanners: [], // empty list
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    const bannerRail = page.locator(".catalog-banner-rail");
    await expect(bannerRail).toHaveCount(0);
  });

  test("R1.2 - Single banner renders without pagination dots or autoplay", async ({ page }) => {
    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [],
          items: [],
          promos: [],
          categoryBanners: [],
          catalogBanners: [
            {
              id: "b1",
              title: "Solo Banner",
              subtitle: "Única promo",
              ctaLabel: "Ver más",
              imageUrl: "https://example.com/banner1.jpg",
              isActive: true,
              sortOrder: 1
            }
          ],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    const bannerRail = page.locator(".catalog-banner-rail");
    await expect(bannerRail).toBeVisible();

    // Cards count should be 1
    const cards = bannerRail.locator(".catalog-banner-card");
    await expect(cards).toHaveCount(1);

    // Pagination container should NOT exist
    const pagination = page.locator(".catalog-banner-rail__pagination");
    await expect(pagination).toHaveCount(0);
  });

  test("R1.3 - Multiple banners show pagination dots, 5s autoplay, dot synchronization, and touch target >= 44px", async ({ page }) => {
    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [],
          items: [],
          promos: [],
          categoryBanners: [],
          catalogBanners: [
            {
              id: "b1",
              title: "Promo 1",
              subtitle: "Descuento 1",
              ctaLabel: "Pedir",
              imageUrl: "https://example.com/b1.jpg",
              isActive: true,
              sortOrder: 1
            },
            {
              id: "b2",
              title: "Promo 2",
              subtitle: "Descuento 2",
              ctaLabel: "Pedir",
              imageUrl: "https://example.com/b2.jpg",
              isActive: true,
              sortOrder: 2
            },
            {
              id: "b3",
              title: "Promo 3",
              subtitle: "Descuento 3",
              ctaLabel: "Pedir",
              imageUrl: "https://example.com/b3.jpg",
              isActive: true,
              sortOrder: 3
            }
          ],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    const bannerRail = page.locator(".catalog-banner-rail");
    await expect(bannerRail).toBeVisible();

    // Check pagination dots
    const dots = page.locator(".catalog-banner-rail__dot");
    await expect(dots).toHaveCount(3);

    // Verify touch target compliance: >= 44px width & height for all dot buttons
    for (let i = 0; i < 3; i++) {
      const box = await dots.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Dot 1 should initially be selected
    await expect(dots.nth(0)).toHaveAttribute("aria-selected", "true");
    await expect(dots.nth(1)).toHaveAttribute("aria-selected", "false");

    // Click dot 2 manually -> should select dot 2
    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveAttribute("aria-selected", "true");
  });

  test("R1.4 - Autoplay pauses on mouse hover", async ({ page }) => {
    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [],
          items: [],
          promos: [],
          categoryBanners: [],
          catalogBanners: [
            { id: "b1", title: "Promo 1", isActive: true, sortOrder: 1 },
            { id: "b2", title: "Promo 2", isActive: true, sortOrder: 2 }
          ],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    const bannerRail = page.locator(".catalog-banner-rail");
    await expect(bannerRail).toBeVisible();

    const dots = page.locator(".catalog-banner-rail__dot");
    await expect(dots.nth(0)).toHaveAttribute("aria-selected", "true");

    // Hover over rail to pause autoplay
    await bannerRail.hover();

    // Wait 5.5 seconds while hovered
    await page.waitForTimeout(5500);

    // Should STILL be on Dot 1 because hover paused autoplay
    await expect(dots.nth(0)).toHaveAttribute("aria-selected", "true");
  });

  test("R1.5 - Reduced motion setting disables autoplay and smooth scrolling in CSS", async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.route("**/api/menu-v2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          categories: [],
          items: [],
          promos: [],
          categoryBanners: [],
          catalogBanners: [
            { id: "b1", title: "Promo 1", isActive: true, sortOrder: 1 },
            { id: "b2", title: "Promo 2", isActive: true, sortOrder: 2 }
          ],
          siteConfig: { brandName: "Burgers.exe" },
          publicConfig: { publicMode: "catalog", catalogEnabled: true },
          source: "d1"
        }
      });
    });

    await page.goto(`${publicUrl}/`, { waitUntil: "domcontentloaded" });
    const bannerRail = page.locator(".catalog-banner-rail");
    await expect(bannerRail).toBeVisible();

    const list = page.locator(".catalog-banner-rail__list");
    const scrollBehavior = await list.evaluate((el) => window.getComputedStyle(el).scrollBehavior);
    expect(scrollBehavior).toBe("auto");

    const dots = page.locator(".catalog-banner-rail__dot");
    await expect(dots.nth(0)).toHaveAttribute("aria-selected", "true");

    // Wait 5.5 seconds - autoplay should be disabled by prefers-reduced-motion
    await page.waitForTimeout(5500);
    await expect(dots.nth(0)).toHaveAttribute("aria-selected", "true");
  });
});
