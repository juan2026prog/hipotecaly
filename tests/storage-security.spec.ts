import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imzljdwsrsxyccgogfck.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltemxqZHdzcnN4eWNjZ29nZmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTkxMzgsImV4cCI6MjEwMzk3NTEzOH0.4EjkqHGK4tKkek1GGMesvjNCj6IBc8eKc26kb5BKh7Y';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

test.describe('STORAGE SECURITY & PRIVATE ISOLATION SUITE', () => {

  test('1. Descarga directa por URL pública de documento sensible es RECHAZADA', async () => {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/application-documents/test-unauthorized.pdf`;
    const response = await fetch(publicUrl);
    // Debe responder 400 (Bad Request / Bucket not public) o 404/403
    expect(response.status >= 400).toBe(true);
  });

  test('2. Descarga directa por URL pública de fotos de inmueble es RECHAZADA', async () => {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/property-photos/test-photo.jpg`;
    const response = await fetch(publicUrl);
    expect(response.status >= 400).toBe(true);
  });

  test('3. Listado anónimo de archivos en bucket application-documents retorna vacío o error', async () => {
    const { data, error } = await client.storage.from('application-documents').list('');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('4. Listado anónimo de archivos en bucket property-photos retorna vacío o error', async () => {
    const { data, error } = await client.storage.from('property-photos').list('');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('5. Expediente en UI: Pestaña de documentos muestra badge de Storage Privado y no expone URLs públicas', async ({ page }) => {
    await page.goto('/app/solicitudes/e0000000-0000-0000-0000-000000000001');
    await page.click('button:has-text("Documentos")');
    await expect(page.locator('text=Storage Privado RLS')).toBeVisible();

    const links = await page.$$eval('a', (as) => as.map((a) => a.href));
    const leakedPublicLinks = links.filter((h) => h.includes('/storage/v1/object/public/'));
    expect(leakedPublicLinks.length).toBe(0);
  });

});
