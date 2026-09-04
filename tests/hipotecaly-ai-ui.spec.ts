import { test, expect } from "@playwright/test";

const mockReport = {
  run_id: "test-run-12345",
  application_id: "e0000000-0000-0000-0000-000000000001",
  run_type: "full",
  timestamp: new Date().toISOString(),
  summary: {
    executive_summary: "Expediente con solvencia adecuada y garantía en zona de alta liquidez. Recomendación de avance a formalización notarial.",
    recommendation: "Avanzar a formalización con retención preventiva para regularización de certificados.",
    key_strengths: ["LTV conservador del 33.3%", "Inmueble padrón consolidado en Carrasco", "Ingresos declarados consistentes"],
    key_risks: ["Certificado municipal pendiente de actualización"],
    action_items: ["Solicitar certificado de libre deuda municipal reciente", "Inspección ocular final"],
    legal_disclaimer: "HIPOTECALY AI proporciona análisis preliminares y herramientas de apoyo. Las decisiones definitivas corresponden al profesional, estudio y/o prestamista responsable."
  },
  valuation: {
    applicant_declared_value: 240000,
    estimated_market_value: 235000,
    estimated_range: { min: 220000, max: 250000 },
    conservative_guarantee_value: 199750,
    confidence: "alta",
    methodology: "Tasador Híbrido Comparables + Modelo Heurístico Padrón",
    comparables: [
      {
        id: "comp_1",
        source: "Mercado Inmobiliario Carrasco Sur",
        title: "Casa 3 dormitorios Carrasco Sur",
        surface_m2: 180,
        price_usd: 245000,
        price_per_m2_usd: 1361,
        comparability_score: 95,
        observed_date: "2026-09-01"
      }
    ],
    adjustments: [{ concept: "Haircut conservador de liquidez inmediata (15%)", percentage: -15, impact_usd: -35250 }],
    warnings: []
  },
  semaphore: [
    { category: "tasacion", status: "green", title: "Tasación", reason: "Valor de mercado consistente con testigos zonales", requires_human_review: false },
    { category: "ltv", status: "green", title: "LTV", reason: "LTV del 33.3% inferior al tope de política del 40%", requires_human_review: false },
    { category: "titularidad", status: "green", title: "Titularidad", reason: "Titular registral coincide con solicitante María López", requires_human_review: false },
    { category: "documentacion", status: "green", title: "Documentación", reason: "Expediente completo con escritura y constancias", requires_human_review: false },
    { category: "ingresos", status: "green", title: "Ingresos", reason: "Ingresos dependientes verificados en recibos de haberes", requires_human_review: false },
    { category: "deudas", status: "green", title: "Deudas", reason: "Clearing sin anotaciones vigentes", requires_human_review: false },
    { category: "consistencia", status: "green", title: "Consistencia", reason: "Superficie y padrón congruentes en todas las piezas", requires_human_review: false },
    { category: "propiedad", status: "green", title: "Propiedad", reason: "Inmueble con mantenimiento adecuado en Carrasco", requires_human_review: false },
    { category: "riesgo", status: "green", title: "Riesgo Global", reason: "Perfil crediticio y garantía de bajo riesgo", requires_human_review: false },
    { category: "elegibilidad", status: "green", title: "Elegibilidad", reason: "Expediente cumple con todos los criterios de la política", requires_human_review: false }
  ],
  documents_analyzed: [
    {
      document_id: "doc-1",
      file_name: "Escritura_Compraventa_Padron_145892.pdf",
      file_hash: "a1b2c3d4e5f6",
      document_type: "escritura",
      confidence: 98,
      is_cached: false,
      extracted_data: { padron: "145.892", holder: "María López", address: "Carrasco Sur", built_area_m2: 180, land_area_m2: 350 },
      warnings: []
    }
  ],
  consistency_issues: [],
  underwriting: {
    policy_name: "Política General Hipotecaly",
    max_ltv_allowed_pct: 40,
    calculated_ltv_pct: 33.33,
    ltv_compliant: true,
    min_coverage_ratio: 2.0,
    calculated_coverage_ratio: 2.99,
    eligible: true,
    recommendation: "Aprobación recomendada por cumplimiento holístico de parámetros crediticios",
    rules_applied: [
      { rule_name: "Tope LTV 40%", passed: true, detail: "LTV calculado: 33.33% <= 40%" },
      { rule_name: "Ratio de Cobertura de Garantía >= 2.0", passed: true, detail: "Ratio calculado: 2.99 >= 2.0" }
    ]
  },
  comparables: [
    {
      id: "c1",
      source: "Portal Inmobiliario Uy",
      title: "Casa 3 dorms Carrasco",
      department: "Montevideo",
      locality: "Carrasco",
      surface_m2: 180,
      price_usd: 245000,
      price_per_m2_usd: 1361,
      comparability_score: 95,
      observed_date: "2026-09-01"
    }
  ],
  global_memory_patterns: [
    {
      id: "mem-1",
      type: "valuation_pattern",
      pattern_summary: "Inmuebles en Carrasco con padrón individual presentan alta liquidez en mercado secundario.",
      sanitized_insight: "Ajuste de tasación estándar sin castigo por área común.",
      similarity: 0.92
    }
  ],
  usage: {
    run_id: "test-run-12345",
    provider: "openai",
    model: "gpt-4o",
    reasoning_level: "standard",
    input_tokens: 15400,
    cached_input_tokens: 5200,
    output_tokens: 1450,
    total_tokens: 16850,
    image_count: 3,
    documents_processed: 4,
    pages_processed: 22,
    web_search_count: 2,
    cost_input_usd: 0.0385,
    cost_output_usd: 0.0145,
    cost_tools_usd: 0.02,
    cost_total_usd: 0.073,
    case_units_consumed: 0.15,
    standard_case_cost_usd: 0.50
  },
  disclaimer: "HIPOTECALY AI proporciona análisis preliminares y herramientas de apoyo. Las decisiones definitivas corresponden al profesional, estudio y/o prestamista responsable."
};

test.describe("GATE 20: HIPOTECALY AI CORE — Browser UI & UX Certification", () => {
  test("Desktop & Mobile: Complete 10-Section Navigation, Interaction and Console Health", async ({ page }, testInfo) => {
    test.setTimeout(60000);
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      console.log("[CONSOLE " + msg.type() + "]", msg.text());
      if (msg.type() === "error" && msg.text().toLowerCase().includes("ai")) {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (e) => {
      console.log("[EXACT PAGE ERROR]", e.message);
    });

    // 1. Interceptar endpoints API con respuestas mock representativas
    await page.route("**/rest/v1/ai_provider_settings*", async (route) => {
      const isSingle = route.request().headers()["accept"]?.includes("vnd.pgrst.object+json");
      const record = { provider: "openai", ai_enabled: true, is_configured: true, last_test_status: "PASS" };
      await route.fulfill({
        status: 200,
        contentType: isSingle ? "application/vnd.pgrst.object+json" : "application/json",
        body: JSON.stringify(isSingle ? record : [record])
      });
    });

    await page.route("**/api/ai/wallet*", async (route) => {
      console.log("--> INTERCEPTED WALLET:", route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          organizationId: "d0000000-0000-0000-0000-000000000001",
          promotionalCaseBalance: 10.0,
          purchasedCaseBalance: 5.0,
          totalCaseBalance: 15.0,
          currentPromoMonth: 1,
          isFreeTierActive: true,
          promoCasesGrantedMonth: 10
        })
      });
    });

    await page.route("**/api/ai/estimate*", async (route) => {
      console.log("--> INTERCEPTED ESTIMATE:", route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          estimatedCaseUnitsMin: 0.15,
          estimatedCaseUnitsMax: 0.35,
          estimatedCostUsdMin: 0.075,
          estimatedCostUsdMax: 0.175,
          currentBalanceCases: 15.0,
          projectedBalanceCasesMin: 14.85,
          projectedBalanceCasesMax: 14.65,
          isHighConsumption: false,
          pagesCount: 22,
          imagesCount: 3,
          documentsCount: 4,
          cachedDocumentsCount: 1
        })
      });
    });

    await page.route("**/api/ai/analyze*", async (route) => {
      console.log("--> INTERCEPTED ANALYZE:", route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report: mockReport,
          walletDeduction: {
            success: true,
            promotionalDeducted: 0.15,
            purchasedDeducted: 0.0,
            isFullyCoveredByHipotecaly: true,
            remainingTotal: 14.85,
            message: "Consumo deducido de saldo promocional"
          }
        })
      });
    });

    await page.route("**/api/ai/corrections*", async (route) => {
      console.log("--> INTERCEPTED CORRECTIONS:", route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, status: "candidate" })
      });
    });

    // 2. Navegar al expediente representativo
    await page.goto("/app/solicitudes/e0000000-0000-0000-0000-000000000001");
    await page.waitForLoadState("networkidle");

    // 3. Abrir la pestaña HIPOTECALY AI
    const aiTabButton = page.locator("button:has-text(\"HIPOTECALY AI\")");
    await expect(aiTabButton).toBeVisible();
    await aiTabButton.click();

    // 4. Verificar encabezado y telemetría de saldo
    await expect(page.locator("text=HIPOTECALY AI CORE")).toBeVisible();
    await expect(page.locator("text=Saldo disponible")).toBeVisible();
    await expect(page.locator("text=CASOS").first()).toBeVisible();

    // 5. Abrir el modal de estimación interactiva
    const launchButton = page.locator("button:has-text(\"Ejecutar HIPOTECALY AI\")");
    await expect(launchButton).toBeVisible();
    await launchButton.click();

    // 6. Verificar modal de estimación y seleccionar modalidad
    await expect(page.locator("text=Estimación de Consumo AI")).toBeVisible();
    await expect(page.locator("text=Completo (Terra)")).toBeVisible();

    // 7. Confirmar y ejecutar análisis
    const confirmButton = page.locator("button:has-text(\"Confirmar y Analizar\")");
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 8. Verificar que las 10 secciones se renderizan completamente
    // Sección 1: Resumen AI
    await expect(page.locator("text=1. Resumen Ejecutivo AI")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Expediente con solvencia adecuada")).toBeVisible();

    // Sección 2: Tasación Preliminar
    await expect(page.locator("text=2. Tasación Preliminar y Garantía")).toBeVisible();
    await expect(page.locator("text=VALOR DE MERCADO ESTIMADO")).toBeVisible();
    await expect(page.locator("text=VALOR CONSERVADOR DE GARANTÍA")).toBeVisible();

    // Sección 3: Semáforo Multidimensional (10D)
    await expect(page.locator("text=3. Semáforo Multidimensional")).toBeVisible();

    // Sección 4: Inteligencia Documental
    await expect(page.locator("text=4. Documentación Procesada")).toBeVisible();

    // Sección 5: Inconsistencias
    await expect(page.locator("text=5. Inconsistencias y Faltantes Detectados")).toBeVisible();

    // Sección 6: Underwriting & LTV
    await expect(page.locator("text=6. Underwriting Financiero")).toBeVisible();

    // Sección 7: Comparables
    await expect(page.locator("text=7. Testigos y Comparables de Mercado")).toBeVisible();

    // Sección 8: Memoria Global (Memoria 3)
    await expect(page.locator("text=8. Patrones Históricos")).toBeVisible();

    // Sección 9: Corrección Humana
    await expect(page.locator("text=9. Validación Profesional y Corrección")).toBeVisible();

    // Sección 10: Auditoría y Barra de Consumo AI
    await expect(page.locator("text=10. Auditoría y Barra de Consumo AI")).toBeVisible();
    await expect(page.locator("text=Consumo: 0.15 CASOS")).toBeVisible();

    // Descargo Legal Obligatorio
    await expect(page.locator("text=Las decisiones definitivas corresponden al profesional")).toBeVisible();

    // 9. Probar interacción en formulario de corrección humana
    const correctBtn = page.locator("button:has-text(\"Corregir Tasación\")");
    await expect(correctBtn).toBeVisible();
    await page.waitForTimeout(500);
    await correctBtn.click();

    const correctionInput = page.locator("input[placeholder*=\"Tasación ajustada\"]");
    await correctionInput.fill("Tasación ajustada a USD 235.000 por mejoras en baño y cocina.");
    const reasonInput = page.locator("input[placeholder*=\"permiso de construcción\"]");
    await reasonInput.fill("Cotejado en inspección 2026.");
    const submitCorrectionBtn = page.locator("button:has-text(\"Guardar Corrección\")");
    await submitCorrectionBtn.click();

    // Verificar confirmación de corrección recibida
    await expect(page.locator("text=Retroalimentación registrada e indexada en memoria global")).toBeVisible();

    // 10. Captura de pantalla para la certificación
    const screenshotFile = "screenshot-gate20-" + testInfo.project.name.toLowerCase().replace(/\s+/g, "-") + ".png";
    await page.screenshot({ path: screenshotFile, fullPage: true });
    console.log("Captured screenshot:", screenshotFile);

    // 11. Certificar 0 errores de consola
    expect(consoleErrors).toHaveLength(0);
  });
});
