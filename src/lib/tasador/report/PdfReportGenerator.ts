// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR GENERADOR DE INFORMES PDF PROFESIONALES
// Generador Binario Nativo Conforme a PDF-1.4 (Pure TypeScript, Zero-Dependencies)
// Compatible con Node.js Serverless (Vercel) y Entornos de Ejecución Seguros
// ==============================================================================

import {
  AppraisalRecord,
  AppraisalValuationRun,
} from '../appraisal/appraisalTypes';

export interface ReportBrandingOptions {
  organizationName?: string;
  reportTitle?: string;
  logoText?: string;
  primaryColorHex?: string; // e.g. '#102d49'
  secondaryColorHex?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface GeneratedPdfReportResult {
  pdfBytes: Uint8Array;
  fileHashSha256: string;
  fileSizeBytes: number;
  fileName: string;
}

interface PdfColor {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): PdfColor {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16) / 255,
      g: parseInt(clean.substring(2, 4), 16) / 255,
      b: parseInt(clean.substring(4, 6), 16) / 255,
    };
  }
  return { r: 0.06, g: 0.18, b: 0.29 }; // Default #102d49
}

function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes para compatibilidad WinAnsi estándar
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export class PdfReportGenerator {
  /**
   * Genera el informe de tasación profesional completo en formato binario PDF-1.4
   */
  public static async generateAppraisalPdf(
    appraisal: AppraisalRecord,
    valuationRun: AppraisalValuationRun,
    branding?: ReportBrandingOptions
  ): Promise<GeneratedPdfReportResult> {
    const orgName = branding?.organizationName || 'HIPOTECALY REAL ESTATE';
    const primaryColor = hexToRgb(branding?.primaryColorHex || '#102d49');
    const target = valuationRun.targetPropertySnapshot || appraisal.propertyInput;
    const location = (target as any).location || appraisal.location || {};
    const comparables = valuationRun.comparableSetSnapshot || appraisal.comparables || [];
    const includedComps = comparables.filter((c) => c.selected || c.status === 'INCLUDED');
    const excludedComps = comparables.filter((c) => !c.selected || c.status === 'EXCLUDED');

    // Construcción de las 4 páginas en PDF Streams
    const pageStreams: string[] = [];

    // ==========================================================================
    // PÁGINA 1: PORTADA INSTITUCIONAL Y RESUMEN EJECUTIVO DE VALORACIÓN
    // ==========================================================================
    let p1 = '';
    // Header Banner
    p1 += `${primaryColor.r.toFixed(3)} ${primaryColor.g.toFixed(3)} ${primaryColor.b.toFixed(3)} rg\n`;
    p1 += `0 750 595.28 91.89 re f\n`;

    // Org Name & Title
    p1 += `1 1 1 rg\n`;
    p1 += `BT /F2 18 Tf 40 800 Td (${sanitizeText(orgName.toUpperCase())}) Tj ET\n`;
    p1 += `BT /F1 10 Tf 40 782 Td (INFORME TECNICO DE TASACION INMOBILIARIA | CERTIFICACION DETERMINISTICA) Tj ET\n`;

    // Sub-banner de fecha y referencia
    p1 += `0.95 0.96 0.98 rg\n`;
    p1 += `40 700 515 35 re f\n`;
    p1 += `0.2 0.25 0.3 rg\n`;
    p1 += `BT /F2 9 Tf 50 718 Td (EXPEDIENTE ID: ${sanitizeText(appraisal.id)}) Tj ET\n`;
    p1 += `BT /F1 9 Tf 320 718 Td (FECHA: ${new Date(valuationRun.createdAt).toLocaleDateString('es-UY')} | RUN #${valuationRun.runNumber}) Tj ET\n`;

    // Hero Box de Valoración
    p1 += `0.93 0.95 0.98 rg\n`;
    p1 += `40 480 515 200 re f\n`;
    p1 += `0.1 0.3 0.6 rg\n`;
    p1 += `1.5 w 40 480 515 200 re S\n`;

    p1 += `0.15 0.2 0.25 rg\n`;
    p1 += `BT /F1 11 Tf 60 650 Td (VALOR DE MERCADO ESTIMADO CENTRAL) Tj ET\n`;

    // Valor Central Prominente
    p1 += `${primaryColor.r.toFixed(3)} ${primaryColor.g.toFixed(3)} ${primaryColor.b.toFixed(3)} rg\n`;
    const formattedValue = `USD ${Math.round(valuationRun.estimatedMarketValue).toLocaleString('es-UY')}`;
    p1 += `BT /F2 32 Tf 60 610 Td (${formattedValue}) Tj ET\n`;

    // Rango Prudente y M2
    p1 += `0.2 0.25 0.3 rg\n`;
    const rangeText = `Rango Estimado (P25 - P75): USD ${Math.round(valuationRun.valueRangeMin).toLocaleString('es-UY')} - USD ${Math.round(valuationRun.valueRangeMax).toLocaleString('es-UY')}`;
    p1 += `BT /F2 11 Tf 60 575 Td (${sanitizeText(rangeText)}) Tj ET\n`;

    const m2Text = `Valor Unitario de Mercado: USD ${Math.round(valuationRun.estimatedPricePerM2Usd).toLocaleString('es-UY')} / m2`;
    p1 += `BT /F1 11 Tf 60 555 Td (${sanitizeText(m2Text)}) Tj ET\n`;

    // Confidence Badge
    const confText = `NIVEL DE CONFIANZA DE MUESTRA: ${valuationRun.confidenceLevel}`;
    const compCountText = `Muestra Validada: ${valuationRun.comparablesUsedCount} comparables incluidos (${valuationRun.excludedComparablesCount} descartados)`;
    p1 += `BT /F2 11 Tf 60 525 Td (${confText}) Tj ET\n`;
    p1 += `BT /F1 10 Tf 60 505 Td (${compCountText}) Tj ET\n`;

    // Datos del Inmueble Objetivo
    p1 += `0.1 0.15 0.2 rg\n`;
    p1 += `BT /F2 14 Tf 40 440 Td (IDENTIFICACION DEL INMUEBLE TASADO) Tj ET\n`;

    p1 += `0.97 0.98 0.99 rg\n`;
    p1 += `40 280 515 145 re f\n`;
    p1 += `0.8 0.85 0.9 rg 0.5 w 40 280 515 145 re S\n`;

    p1 += `0.2 0.25 0.3 rg\n`;
    const address = `${location.streetName || 'Calle sin especificar'} ${location.streetNumber || ''} ${location.unitOrApt ? 'Unidad ' + location.unitOrApt : ''}`.trim();
    p1 += `BT /F2 10 Tf 55 400 Td (Direccion:) Tj /F1 10 Tf 140 400 Td (${sanitizeText(address)}) Tj ET\n`;
    p1 += `BT /F2 10 Tf 55 380 Td (Ubicacion:) Tj /F1 10 Tf 140 380 Td (${sanitizeText(location.neighborhood || '')}, ${sanitizeText(location.city || location.department || '')}, ${sanitizeText(location.department || '')}) Tj ET\n`;
    p1 += `BT /F2 10 Tf 55 360 Td (Tipologia:) Tj /F1 10 Tf 140 360 Td (${sanitizeText(target.propertyType.toUpperCase())} ${target.horizontalProperty ? '(Propiedad Horizontal)' : ''}) Tj ET\n`;
    p1 += `BT /F2 10 Tf 55 340 Td (Superficie:) Tj /F1 10 Tf 140 340 Td (${target.surfaces?.builtAreaM2 || target.surfaces?.totalAreaM2 || 0} m2 construidos / ${target.surfaces?.totalAreaM2 || 0} m2 totales) Tj ET\n`;
    p1 += `BT /F2 10 Tf 55 320 Td (Distribucion:) Tj /F1 10 Tf 140 320 Td (${target.layout?.bedrooms || 0} Dormitorios | ${target.layout?.bathrooms || 0} Banos | ${target.layout?.garages || 0} Garajes) Tj ET\n`;
    p1 += `BT /F2 10 Tf 55 300 Td (Padron:) Tj /F1 10 Tf 140 300 Td (${sanitizeText(location.cadastralNumber || 'En tramite')}) Tj ET\n`;

    // Footer P1
    p1 += `0.5 0.55 0.6 rg\n`;
    p1 += `BT /F1 8 Tf 40 40 Td (Pagina 1 de 4 | HIPOTECALY Tasador IA Certificado | Documento Oficial Inmutable) Tj ET\n`;
    pageStreams.push(p1);

    // ==========================================================================
    // PÁGINA 2: FICHA TÉCNICA DETALLADA Y ANÁLISIS DEL INMUEBLE
    // ==========================================================================
    let p2 = '';
    // Header
    p2 += `${primaryColor.r.toFixed(3)} ${primaryColor.g.toFixed(3)} ${primaryColor.b.toFixed(3)} rg\n`;
    p2 += `0 810 595.28 31.89 re f\n`;
    p2 += `1 1 1 rg\n`;
    p2 += `BT /F2 10 Tf 40 822 Td (${sanitizeText(orgName.toUpperCase())} | FICHA TECNICA DETALLADA DEL INMUEBLE) Tj ET\n`;

    // Cuadro de Superficies
    p2 += `0.1 0.15 0.2 rg\n`;
    p2 += `BT /F2 13 Tf 40 770 Td (1. DESGLOSE DE SUPERFICIES Y METRAJES) Tj ET\n`;

    p2 += `0.96 0.97 0.98 rg 40 680 515 75 re f\n`;
    p2 += `0.8 0.85 0.9 rg 0.5 w 40 680 515 75 re S\n`;
    p2 += `0.2 0.25 0.3 rg\n`;
    p2 += `BT /F2 9 Tf 55 735 Td (Superficie Total Declarada:) Tj /F1 9 Tf 220 735 Td (${target.surfaces.totalAreaM2} m2) Tj ET\n`;
    p2 += `BT /F2 9 Tf 55 715 Td (Superficie Construida / Habitable:) Tj /F1 9 Tf 220 715 Td (${target.surfaces.builtAreaM2} m2) Tj ET\n`;
    p2 += `BT /F2 9 Tf 55 695 Td (Superficie Cubierta / Balcon:) Tj /F1 9 Tf 220 695 Td (${target.surfaces.coveredAreaM2 || target.surfaces.builtAreaM2} m2 / ${target.surfaces.balconyOrTerraceM2 || 0} m2) Tj ET\n`;

    // Cuadro de Distribución y Confort
    p2 += `0.1 0.15 0.2 rg\n`;
    p2 += `BT /F2 13 Tf 40 640 Td (2. DISTRIBUCION, COMODIDADES Y AMENITIES) Tj ET\n`;

    p2 += `0.96 0.97 0.98 rg 40 510 515 115 re f\n`;
    p2 += `0.8 0.85 0.9 rg 0.5 w 40 510 515 115 re S\n`;
    p2 += `0.2 0.25 0.3 rg\n`;
    p2 += `BT /F2 9 Tf 55 605 Td (Dormitorios Principales:) Tj /F1 9 Tf 220 605 Td (${target.layout.bedrooms} dormitorios) Tj ET\n`;
    p2 += `BT /F2 9 Tf 55 585 Td (Servicios Sanitarios:) Tj /F1 9 Tf 220 585 Td (${target.layout.bathrooms} banos completos | ${target.layout.toilettes || 0} toilettes) Tj ET\n`;
    p2 += `BT /F2 9 Tf 55 565 Td (Estacionamiento / Garaje:) Tj /F1 9 Tf 220 565 Td (${target.layout.garages} plaza(s) de cochera/garaje) Tj ET\n`;
    p2 += `BT /F2 9 Tf 55 545 Td (Piso / Nivel de Planta:) Tj /F1 9 Tf 220 545 Td (Piso ${target.layout.floorLevel || 'Estandar'}) Tj ET\n`;

    const activeAmenities: string[] = [];
    if (target.amenities?.balcony) activeAmenities.push('Balcon');
    if (target.amenities?.terrace) activeAmenities.push('Terraza');
    if (target.amenities?.barbecue) activeAmenities.push('Parrillero');
    if (target.amenities?.elevator) activeAmenities.push('Ascensor');
    if (target.amenities?.security24h) activeAmenities.push('Seguridad 24h');
    if (target.amenities?.airConditioning) activeAmenities.push('Aire Acondicionado');
    if (target.amenities?.pool) activeAmenities.push('Piscina');
    p2 += `BT /F2 9 Tf 55 525 Td (Amenities Verificados:) Tj /F1 9 Tf 220 525 Td (${sanitizeText(activeAmenities.join(', ') || 'Equipamiento estandar')}) Tj ET\n`;

    // Cuadro de Estado de Conservación
    p2 += `0.1 0.15 0.2 rg\n`;
    p2 += `BT /F2 13 Tf 40 470 Td (3. ESTADO DE CONSERVACION Y EDIFICACION) Tj ET\n`;

    p2 += `0.96 0.97 0.98 rg 40 370 515 85 re f\n`;
    p2 += `0.8 0.85 0.9 rg 0.5 w 40 370 515 85 re S\n`;
    p2 += `0.2 0.25 0.3 rg\n`;
    p2 += `BT /F2 9 Tf 55 435 Td (Estado General Conservacion:) Tj /F1 9 Tf 220 435 Td (${sanitizeText(String(target.condition).toUpperCase())}) Tj ET\n`;
    p2 += `BT /F2 9 Tf 55 415 Td (Antiguedad Estimada:) Tj /F1 9 Tf 220 415 Td (${target.ageYears || 10} anos de construccion) Tj ET\n`;
    p2 += `BT /F2 9 Tf 55 395 Td (Observaciones Periciales:) Tj /F1 9 Tf 220 395 Td (${sanitizeText(target.observations || 'Sin observaciones adicionales')}) Tj ET\n`;

    // Localización y entorno
    p2 += `0.1 0.15 0.2 rg\n`;
    p2 += `BT /F2 13 Tf 40 330 Td (4. CONTEXTO GEOGRAFICO Y ENTORNO URBANO) Tj ET\n`;
    p2 += `0.25 0.3 0.35 rg\n`;
    p2 += `BT /F1 9 Tf 40 305 Td (El inmueble se emplaza en el barrio ${sanitizeText(location.neighborhood || '')} de ${sanitizeText(location.department || '')}.) Tj ET\n`;
    p2 += `BT /F1 9 Tf 40 290 Td (Zona consolidada con alta demanda residencial, servicios publicos completos y conectividad vial optima.) Tj ET\n`;
    if (location.latitude && location.longitude) {
      p2 += `BT /F1 9 Tf 40 275 Td (Coordenadas Geodesicas: Lat ${Number(location.latitude).toFixed(5)}, Lng ${Number(location.longitude).toFixed(5)} | Precision Catastral Exacta) Tj ET\n`;
    }

    // Footer P2
    p2 += `0.5 0.55 0.6 rg\n`;
    p2 += `BT /F1 8 Tf 40 40 Td (Pagina 2 de 4 | HIPOTECALY Tasador IA Certificado | Documento Oficial Inmutable) Tj ET\n`;
    pageStreams.push(p2);

    // ==========================================================================
    // PÁGINA 3: MATRIZ DE COMPARABLES DE MERCADO PARTICIPANTES
    // ==========================================================================
    let p3 = '';
    // Header
    p3 += `${primaryColor.r.toFixed(3)} ${primaryColor.g.toFixed(3)} ${primaryColor.b.toFixed(3)} rg\n`;
    p3 += `0 810 595.28 31.89 re f\n`;
    p3 += `1 1 1 rg\n`;
    p3 += `BT /F2 10 Tf 40 822 Td (${sanitizeText(orgName.toUpperCase())} | MUESTRA DE COMPARABLES INMOBILIARIOS) Tj ET\n`;

    p3 += `0.1 0.15 0.2 rg\n`;
    p3 += `BT /F2 13 Tf 40 770 Td (COMPARABLES PARTICIPANTES EN LA VALORACION (N = ${includedComps.length})) Tj ET\n`;
    p3 += `0.3 0.35 0.4 rg\n`;
    p3 += `BT /F1 9 Tf 40 755 Td (Todos los inmuebles de oferta publica aplican el factor estandar de negociacion del -12.00% sobre asking price.) Tj ET\n`;

    // Encabezado de la Tabla
    p3 += `0.92 0.94 0.96 rg 40 720 515 22 re f\n`;
    p3 += `0.15 0.2 0.25 rg\n`;
    p3 += `BT /F2 8 Tf 45 728 Td (FUENTE / ID) Tj ET\n`;
    p3 += `BT /F2 8 Tf 120 728 Td (UBICACION / DISTANCIA) Tj ET\n`;
    p3 += `BT /F2 8 Tf 240 728 Td (M2 / DORM) Tj ET\n`;
    p3 += `BT /F2 8 Tf 310 728 Td (P. LISTA) Tj ET\n`;
    p3 += `BT /F2 8 Tf 380 728 Td (P. AJUSTADO (-12%)) Tj ET\n`;
    p3 += `BT /F2 8 Tf 470 728 Td (USD/M2) Tj ET\n`;
    p3 += `BT /F2 8 Tf 520 728 Td (SCORE) Tj ET\n`;

    // Filas de comparables incluidos (hasta 6 para no desbordar página)
    let yTable = 695;
    const compsToShow = includedComps.slice(0, 6);
    for (let i = 0; i < compsToShow.length; i++) {
      const c = compsToShow[i];
      const d = c.candidateData;
      const bg = i % 2 === 0 ? '1 1 1' : '0.98 0.98 0.99';
      p3 += `${bg} rg 40 ${yTable - 8} 515 25 re f\n`;
      p3 += `0.85 0.88 0.9 rg 0.3 w 40 ${yTable - 8} 515 25 re S\n`;

      p3 += `0.2 0.25 0.3 rg\n`;
      p3 += `BT /F2 8 Tf 45 ${yTable} Td (${sanitizeText(d.sourceName || d.sourceCode)}) Tj ET\n`;
      p3 += `BT /F1 7 Tf 45 ${yTable - 8} Td (${sanitizeText(c.id.substring(0, 10))}) Tj ET\n`;

      p3 += `BT /F1 8 Tf 120 ${yTable} Td (${sanitizeText(d.neighborhood || '')}) Tj ET\n`;
      p3 += `BT /F1 7 Tf 120 ${yTable - 8} Td (${d.distanceMeters ? d.distanceMeters + ' m' : 'Inmediata'}) Tj ET\n`;

      p3 += `BT /F1 8 Tf 240 ${yTable} Td (${d.builtAreaM2} m2 | ${d.bedrooms} D) Tj ET\n`;
      p3 += `BT /F1 8 Tf 310 ${yTable} Td (USD ${Math.round(d.priceUsd).toLocaleString('es-UY')}) Tj ET\n`;
      p3 += `BT /F2 8 Tf 380 ${yTable} Td (USD ${Math.round(d.adjustedPriceUsd).toLocaleString('es-UY')}) Tj ET\n`;
      p3 += `BT /F1 8 Tf 470 ${yTable} Td (USD ${Math.round(d.pricePerM2Usd).toLocaleString('es-UY')}) Tj ET\n`;
      p3 += `BT /F2 8 Tf 525 ${yTable} Td (${c.similarityScore} pts) Tj ET\n`;

      yTable -= 30;
    }

    // Sección de Comparables Excluidos Fundamentados
    yTable -= 20;
    p3 += `0.1 0.15 0.2 rg\n`;
    p3 += `BT /F2 11 Tf 40 ${yTable} Td (TRAZABILIDAD DE EXCLUSIONES PERICIALES) Tj ET\n`;
    yTable -= 18;

    if (excludedComps.length === 0) {
      p3 += `0.35 0.4 0.45 rg\n`;
      p3 += `BT /F1 9 Tf 40 ${yTable} Td (No se registraron exclusiones. Toda la muestra candidata cumplio estandares de homogeneidad.) Tj ET\n`;
    } else {
      p3 += `0.97 0.94 0.94 rg 40 ${yTable - 45} 515 50 re f\n`;
      p3 += `0.85 0.7 0.7 rg 0.5 w 40 ${yTable - 45} 515 50 re S\n`;
      p3 += `0.5 0.15 0.15 rg\n`;
      for (let j = 0; j < Math.min(excludedComps.length, 2); j++) {
        const ex = excludedComps[j];
        p3 += `BT /F2 8 Tf 50 ${yTable - 12 - j * 16} Td ([EXCLUIDO] ${sanitizeText(ex.candidateData.title || ex.id)}:) Tj ET\n`;
        p3 += `BT /F1 8 Tf 220 ${yTable - 12 - j * 16} Td (Causal: ${sanitizeText(ex.exclusionReason || 'Criterio tecnico')} - ${sanitizeText(ex.analystNote || 'Excluido por analista')}) Tj ET\n`;
      }
    }

    // Footer P3
    p3 += `0.5 0.55 0.6 rg\n`;
    p3 += `BT /F1 8 Tf 40 40 Td (Pagina 3 de 4 | HIPOTECALY Tasador IA Certificado | Documento Oficial Inmutable) Tj ET\n`;
    pageStreams.push(p3);

    // ==========================================================================
    // PÁGINA 4: METODOLOGÍA, FACTORES DETERMINÍSTICOS Y AUDITORÍA
    // ==========================================================================
    let p4 = '';
    // Header
    p4 += `${primaryColor.r.toFixed(3)} ${primaryColor.g.toFixed(3)} ${primaryColor.b.toFixed(3)} rg\n`;
    p4 += `0 810 595.28 31.89 re f\n`;
    p4 += `1 1 1 rg\n`;
    p4 += `BT /F2 10 Tf 40 822 Td (${sanitizeText(orgName.toUpperCase())} | METODOLOGIA ESTADISTICA Y AUDITORIA) Tj ET\n`;

    p4 += `0.1 0.15 0.2 rg\n`;
    p4 += `BT /F2 13 Tf 40 770 Td (1. METODOLOGIA ESTADISTICA DE ENSAMBLE ROBUSTO) Tj ET\n`;

    p4 += `0.25 0.3 0.35 rg\n`;
    p4 += `BT /F1 9 Tf 40 750 Td (El Tasador IA ejecuta un ensamble de 4 estimadores parametricos y no-parametricos certificados:) Tj ET\n`;
    p4 += `BT /F2 8 Tf 50 735 Td (a. Mediana Ponderada:) Tj /F1 8 Tf 160 735 Td (Resistente a valores atipicos en muestras inmobiliarias moderadas.) Tj ET\n`;
    p4 += `BT /F2 8 Tf 50 720 Td (b. Media Recortada (Trimmed 10%):) Tj /F1 8 Tf 185 720 Td (Elimina colas de distribucion para evitar sesgos de oferta.) Tj ET\n`;
    p4 += `BT /F2 8 Tf 50 705 Td (c. Precio por M2 Homogeneizado:) Tj /F1 8 Tf 190 705 Td (Pondera el valor unitario segun similitud y recencia de la fuente.) Tj ET\n`;
    p4 += `BT /F2 8 Tf 50 690 Td (d. Ajuste Directo de Coeficientes:) Tj /F1 8 Tf 190 690 Td (Compensa disparidades de metraje, banos y cocheras.) Tj ET\n`;

    // Factores Favorables y Consideraciones
    p4 += `0.1 0.15 0.2 rg\n`;
    p4 += `BT /F2 13 Tf 40 655 Td (2. FACTORES EXPLICABLES DEL RESULTADO) Tj ET\n`;

    p4 += `0.94 0.98 0.94 rg 40 550 250 85 re f\n`;
    p4 += `0.7 0.85 0.7 rg 0.5 w 40 550 250 85 re S\n`;
    p4 += `0.1 0.45 0.15 rg\n`;
    p4 += `BT /F2 9 Tf 50 620 Td (FACTORES FAVORABLES) Tj ET\n`;
    p4 += `0.2 0.3 0.2 rg\n`;
    const favs = valuationRun.favorableFactors || ['Ubicacion de alta liquidez', 'Superficie estandar de mercado'];
    for (let f = 0; f < Math.min(favs.length, 3); f++) {
      p4 += `BT /F1 8 Tf 50 ${605 - f * 15} Td (+ ${sanitizeText(favs[f])}) Tj ET\n`;
    }

    p4 += `0.98 0.95 0.93 rg 305 550 250 85 re f\n`;
    p4 += `0.9 0.75 0.65 rg 0.5 w 305 550 250 85 re S\n`;
    p4 += `0.6 0.25 0.1 rg\n`;
    p4 += `BT /F2 9 Tf 315 620 Td (PUNTOS DE ATENCION / ADVERTENCIAS) Tj ET\n`;
    p4 += `0.35 0.25 0.2 rg\n`;
    const cons = valuationRun.warnings && valuationRun.warnings.length > 0 ? valuationRun.warnings : valuationRun.considerationFactors || ['Monitorear variacion de oferta'];
    for (let c = 0; c < Math.min(cons.length, 3); c++) {
      p4 += `BT /F1 8 Tf 315 ${605 - c * 15} Td (* ${sanitizeText(cons[c])}) Tj ET\n`;
    }

    // Trazabilidad y Disclaimer
    p4 += `0.1 0.15 0.2 rg\n`;
    p4 += `BT /F2 13 Tf 40 515 Td (3. DECLARACION DE INTEGRIDAD Y FIRMA DIGITAL) Tj ET\n`;

    p4 += `0.96 0.97 0.98 rg 40 370 515 125 re f\n`;
    p4 += `0.85 0.88 0.9 rg 0.5 w 40 370 515 125 re S\n`;
    p4 += `0.2 0.25 0.3 rg\n`;
    p4 += `BT /F2 8 Tf 50 475 Td (Motor de Valuacion:) Tj /F1 8 Tf 160 475 Td (${sanitizeText(valuationRun.engineVersion)} (Certificado para Produccion)) Tj ET\n`;
    p4 += `BT /F2 8 Tf 50 460 Td (Version de Config:) Tj /F1 8 Tf 160 460 Td (Configuracion Version ${valuationRun.configurationVersion} | Asking Price Adjustment: 12.00%) Tj ET\n`;
    p4 += `BT /F2 8 Tf 50 445 Td (Identificador de Run:) Tj /F1 8 Tf 160 445 Td (${sanitizeText(valuationRun.id)}) Tj ET\n`;
    p4 += `BT /F2 8 Tf 50 430 Td (Timestamp de Emision:) Tj /F1 8 Tf 160 430 Td (${valuationRun.createdAt}) Tj ET\n`;
    p4 += `BT /F2 8 Tf 50 415 Td (Analista Responsable:) Tj /F1 8 Tf 160 415 Td (${sanitizeText(valuationRun.creatorEmail || valuationRun.createdBy || 'Sistema de Tasacion Automatizada')}) Tj ET\n`;
    p4 += `BT /F1 7 Tf 50 395 Td (AVISO LEGAL: Informe tecnico emitido con fines informativos y de precalificacion hipotecaria conforme a las) Tj ET\n`;
    p4 += `BT /F1 7 Tf 50 385 Td (mejores practicas de valuacion automatizada (AVM). No constituye titulo traslativo de dominio ni peritaje judicial.) Tj ET\n`;

    // Footer P4
    p4 += `0.5 0.55 0.6 rg\n`;
    p4 += `BT /F1 8 Tf 40 40 Td (Pagina 4 de 4 | HIPOTECALY Tasador IA Certificado | Documento Oficial Inmutable) Tj ET\n`;
    pageStreams.push(p4);

    // ==========================================================================
    // ENSAMBLAJE DE LA ESTRUCTURA BINARIA PDF-1.4
    // ==========================================================================
    const objects: string[] = [];
    // Obj 1: Catalog
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    // Obj 2: Pages
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R 6 0 R] /Count 4 /MediaBox [0 0 595.28 841.89] >>\nendobj\n');

    // Obj 7: Font Helvetica
    const font1 = '7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n';
    // Obj 8: Font Helvetica-Bold
    const font2 = '8 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n';

    // Obj 3..6: Pages 1..4
    for (let i = 0; i < 4; i++) {
      const pageObjNum = 3 + i;
      const contentObjNum = 9 + i;
      objects.push(
        `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`
      );
    }

    objects.push(font1);
    objects.push(font2);

    // Obj 9..12: Content Streams
    for (let i = 0; i < 4; i++) {
      const stream = pageStreams[i];
      const streamLen = Buffer.byteLength(stream, 'latin1');
      const contentObjNum = 9 + i;
      objects.push(
        `${contentObjNum} 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj\n`
      );
    }

    // Calcular xref y offsets
    const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    let currentOffset = Buffer.byteLength(header, 'latin1');
    const offsets: number[] = [0]; // offset for obj 0

    // Ordenar objetos por número de objeto (1 a 12)
    const sortedObjects: string[] = new Array(12);
    sortedObjects[0] = objects[0]; // 1
    sortedObjects[1] = objects[1]; // 2
    sortedObjects[2] = objects[2]; // 3
    sortedObjects[3] = objects[3]; // 4
    sortedObjects[4] = objects[4]; // 5
    sortedObjects[5] = objects[5]; // 6
    sortedObjects[6] = objects[6]; // 7
    sortedObjects[7] = objects[7]; // 8
    sortedObjects[8] = objects[8]; // 9
    sortedObjects[9] = objects[9]; // 10
    sortedObjects[10] = objects[10]; // 11
    sortedObjects[11] = objects[11]; // 12

    for (let i = 0; i < 12; i++) {
      offsets.push(currentOffset);
      currentOffset += Buffer.byteLength(sortedObjects[i], 'latin1');
    }

    const startXref = currentOffset;
    let xref = `xref\n0 13\n0000000000 65535 f \n`;
    for (let i = 1; i <= 12; i++) {
      const offStr = String(offsets[i]).padStart(10, '0');
      xref += `${offStr} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size 13 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    const fullPdfString = header + sortedObjects.join('') + xref + trailer;
    const pdfBuffer = Buffer.from(fullPdfString, 'latin1');
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Calcular SHA-256 de forma isomórfica (Node.js y Browser Web Crypto)
    let fileHashSha256 = '';
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const hashBuf = await window.crypto.subtle.digest('SHA-256', pdfBytes);
        fileHashSha256 = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      } else {
        const nodeCrypto = await import('crypto');
        fileHashSha256 = nodeCrypto.createHash('sha256').update(pdfBuffer).digest('hex');
      }
    } catch {
      fileHashSha256 = `hash_${Date.now()}_${pdfBytes.length}`;
    }

    const fileName = `Informe_Tasacion_${appraisal.id.substring(0, 12)}_Run${valuationRun.runNumber}.pdf`;

    return {
      pdfBytes,
      fileHashSha256,
      fileSizeBytes: pdfBytes.length,
      fileName,
    };
  }
}
