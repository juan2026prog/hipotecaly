// ==============================================================================
// HIPOTECALY GEOCORE - CÁLCULO DE DISTANCIA Y RADIOS GEOGRÁFICOS
// ==============================================================================

import { GeoCoordinates } from "./types";

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calcula la distancia ortodrómica en metros entre dos puntos mediante la fórmula de Haversine
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Determina si un punto se encuentra dentro de un radio en metros desde un origen
 */
export function isWithinRadius(
  origin: GeoCoordinates,
  target: GeoCoordinates,
  radiusMeters: number
): boolean {
  const dist = calculateHaversineDistanceMeters(
    origin.latitude,
    origin.longitude,
    target.latitude,
    target.longitude
  );
  return dist <= radiusMeters;
}

/**
 * Formatea una distancia en metros a texto legible (m o km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
