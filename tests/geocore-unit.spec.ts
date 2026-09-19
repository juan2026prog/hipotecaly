// ==============================================================================
// HIPOTECALY GEOCORE - SUITE DE PRUEBAS UNITARIAS DE INFRAESTRUCTURA GEOGRÁFICA
// Validación de Normalización, Haversine, Jerarquía de Precisión, Cache y GeoService
// ==============================================================================

import { test, expect } from '@playwright/test';
import {
  URUGUAY_DEPARTMENTS,
  normalizeDepartment,
  normalizeLocality,
  normalizeStreetName,
  formatUruguayAddress,
  isValidUruguayCoordinate,
} from '../src/lib/geo/normalization';
import {
  calculateHaversineDistanceMeters,
  isWithinRadius,
  formatDistance,
} from '../src/lib/geo/distance';
import {
  PRECISION_HIERARCHY,
  getPrecisionDescriptor,
  isExactPrecision,
} from '../src/lib/geo/precision';
import { GeoCache } from '../src/lib/geo/cache';
import { GeoService } from '../src/lib/geo/geoService';

test.describe.serial('GEOCORE - NORMALIZACIÓN Y CATÁLOGO OFICIAL DE URUGUAY', () => {
  test('debe contener exactamente los 19 departamentos oficiales de Uruguay', () => {
    expect(URUGUAY_DEPARTMENTS).toHaveLength(19);
    expect(URUGUAY_DEPARTMENTS).toContain('Montevideo');
    expect(URUGUAY_DEPARTMENTS).toContain('Canelones');
    expect(URUGUAY_DEPARTMENTS).toContain('Maldonado');
    expect(URUGUAY_DEPARTMENTS).toContain('Rocha');
    expect(URUGUAY_DEPARTMENTS).toContain('Colonia');
    expect(URUGUAY_DEPARTMENTS).toContain('Salto');
    expect(URUGUAY_DEPARTMENTS).toContain('Paysandú');
  });

  test('normalizeDepartment debe resolver variaciones con y sin tilde o mayúsculas', () => {
    expect(normalizeDepartment('montevideo')).toBe('Montevideo');
    expect(normalizeDepartment('SAN JOSÉ')).toBe('San José');
    expect(normalizeDepartment('san jose')).toBe('San José');
    expect(normalizeDepartment('PAYSANDU')).toBe('Paysandú');
    expect(normalizeDepartment('tacuarembo')).toBe('Tacuarembó');
    expect(normalizeDepartment('rio negro')).toBe('Río Negro');
    expect(normalizeDepartment('Inexistente')).toBeNull();
  });

  test('normalizeStreetName debe limpiar sufijos y prefijos comunes', () => {
    expect(normalizeStreetName('  Av. 18 de Julio  ')).toBe('18 de Julio');
    expect(normalizeStreetName('Calle 21 de Setiembre')).toBe('21 de Setiembre');
    expect(normalizeStreetName('Bvar. Artigas')).toBe('Artigas');
  });

  test('formatUruguayAddress debe generar cadenas de dirección canónicas y legibles', () => {
    const formatted = formatUruguayAddress({
      country: 'Uruguay',
      department: 'Montevideo',
      locality: 'Montevideo',
      neighborhood: 'Pocitos',
      streetName: 'Bulevar España',
      streetNumber: '2450',
      precision: 'EXACT_ADDRESS',
      source: 'ide_uruguay',
      verified: true,
    });
    expect(formatted).toBe('Bulevar España 2450, Pocitos, Montevideo');
  });

  test('isValidUruguayCoordinate debe validar bounding box de Uruguay', () => {
    expect(isValidUruguayCoordinate(-34.9011, -56.1645)).toBe(true);
    expect(isValidUruguayCoordinate(-34.9644, -54.9439)).toBe(true);
    expect(isValidUruguayCoordinate(48.8566, 2.3522)).toBe(false);
    expect(isValidUruguayCoordinate(null, null)).toBe(false);
  });
});

test.describe.serial('GEOCORE - CÁLCULO DE DISTANCIAS HAVERSINE Y RADIOS MÉTRICOS', () => {
  const plazaIndependencia = { latitude: -34.9065, longitude: -56.1998 };
  const pocitosTrouville = { latitude: -34.9220, longitude: -56.1510 };

  test('calculateHaversineDistanceMeters debe calcular distancia geodésica real en metros', () => {
    const distMeters = calculateHaversineDistanceMeters(
      plazaIndependencia.latitude,
      plazaIndependencia.longitude,
      pocitosTrouville.latitude,
      pocitosTrouville.longitude
    );
    // Distancia estimada entre Plaza Independencia y Trouville: ~4.7 - 4.9 km
    expect(distMeters).toBeGreaterThan(4500);
    expect(distMeters).toBeLessThan(5200);
  });

  test('isWithinRadius debe verificar correctamente la contención en radio métrico', () => {
    const within5km = isWithinRadius(
      plazaIndependencia,
      pocitosTrouville,
      5000 // 5km
    );
    expect(within5km).toBe(true);

    const within2km = isWithinRadius(
      plazaIndependencia,
      pocitosTrouville,
      2000 // 2km
    );
    expect(within2km).toBe(false);
  });

  test('formatDistance debe formatear en metros o kilómetros según magnitud', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(2500)).toBe('2.5 km');
  });
});

test.describe.serial('GEOCORE - JERARQUÍA DE PRECISIÓN Y CONTROL DE CALIDAD', () => {
  test('debe clasificar EXACT_ADDRESS y STREET_NUMBER como exactos', () => {
    expect(isExactPrecision('EXACT_ADDRESS')).toBe(true);
    expect(isExactPrecision('STREET_NUMBER')).toBe(true);
    expect(isExactPrecision('STREET')).toBe(false);
    expect(isExactPrecision('NEIGHBORHOOD')).toBe(false);
    expect(isExactPrecision('LOCALITY')).toBe(false);
    expect(isExactPrecision('DEPARTMENT')).toBe(false);
    expect(isExactPrecision('UNKNOWN')).toBe(false);
  });

  test('getPrecisionDescriptor debe retornar metadatos y etiquetas adecuadas', () => {
    const exactDesc = getPrecisionDescriptor('EXACT_ADDRESS');
    expect(exactDesc.label).toBe('Dirección exacta verificada');
    expect(exactDesc.isExact).toBe(true);
    expect(exactDesc.colorClass).toContain('emerald');

    const approxDesc = getPrecisionDescriptor('NEIGHBORHOOD');
    expect(approxDesc.label).toBe('Ubicación aproximada: barrio');
    expect(approxDesc.isExact).toBe(false);
    expect(approxDesc.colorClass).toContain('amber');
  });
});

test.describe.serial('GEOCORE - CACHE EN MEMORIA CON TTL', () => {
  test('debe almacenar y recuperar valores con clave prefijada', () => {
    const cache = GeoCache.getInstance();
    cache.set('test_key', { sample: 123 }, 5000);
    const retrieved = cache.get<{ sample: number }>('test_key');
    expect(retrieved).toEqual({ sample: 123 });
  });

  test('debe retornar null para claves expiradas o inexistentes', () => {
    const cache = GeoCache.getInstance();
    cache.set('expired_key', { sample: 999 }, -1000); // Expirado
    const retrieved = cache.get('expired_key');
    expect(retrieved).toBeNull();
  });
});

test.describe.serial('GEOCORE - GEOSERVICE ORCHESTRATOR', () => {
  test('debe inicializarse como singleton con el provider IDE Uruguay', () => {
    const service1 = GeoService.getInstance();
    const service2 = GeoService.getInstance();
    expect(service1).toBe(service2);
  });

  test('debe listar localidades por departamento', async () => {
    const localities = await GeoService.getInstance().getLocalities('Montevideo');
    expect(localities.length).toBeGreaterThan(0);
    expect(localities.some(l => l.name.toLowerCase().includes('montevideo'))).toBe(true);
  });
});
