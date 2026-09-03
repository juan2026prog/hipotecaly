import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

test.describe('VISUAL QA & RESPONSIVE CERTIFICATION', () => {

  test('Captura de Screenshots QA en Desktop 1440 y Mobile 390', async ({ page }) => {
    // 1. Marketplace Desktop 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'marketplace-desktop-1440.png'), fullPage: false });

    // 2. Marketplace Mobile 390
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'marketplace-mobile-390.png'), fullPage: false });

    // 3. SaaS Desktop 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plataforma');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'saas-desktop-1440.png'), fullPage: false });

    // 4. SaaS Mobile 390
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/plataforma');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'saas-mobile-390.png'), fullPage: false });

    // 5. Dashboard Desktop 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/app');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard-desktop-1440.png'), fullPage: false });

    // 6. Dashboard Mobile 390
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/app');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard-mobile-390.png'), fullPage: false });

    // 7. Wizard Mobile 390
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/solicitar');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'wizard-mobile-390.png'), fullPage: false });

    // 8. Mi Cuenta Mobile 390
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/mi-cuenta');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'micuenta-mobile-390.png'), fullPage: false });
  });

  const viewports = [
    { name: 'Mobile Compact (360x740)', width: 360, height: 740 },
    { name: 'Mobile Standard (390x844)', width: 390, height: 844 },
    { name: 'Mobile Large (430x932)', width: 430, height: 932 },
    { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024 },
    { name: 'Tablet Landscape (1024x768)', width: 1024, height: 768 },
    { name: 'Laptop (1280x800)', width: 1280, height: 800 },
    { name: 'Desktop High-Res (1440x900)', width: 1440, height: 900 },
  ];

  const routes = ['/', '/plataforma', '/simulador', '/solicitar', '/mi-cuenta', '/app', '/app/solicitudes'];

  for (const vp of viewports) {
    test(`Certificación Responsive en ${vp.name}: Sin desborde horizontal (scrollWidth <= innerWidth)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of routes) {
        await page.goto(route);

        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        expect(
          hasOverflow,
          `Desborde horizontal detectado en ruta ${route} a resolución ${vp.width}x${vp.height}`
        ).toBe(false);
      }
    });
  }

});
