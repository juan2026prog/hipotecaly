// ==============================================================================
// VERCEL CONSOLIDATED SERVERLESS FUNCTION: /api/v1/[...route]
// Punto de entrada único para todos los endpoints de la API v1 de HIPOTECALY
// ==============================================================================

import simulationsHandler from '../../server/enterprise/handlers/simulationsHandler';
import applicationsHandler from '../../server/enterprise/handlers/applicationsHandler';
import webhooksHandler from '../../server/enterprise/handlers/webhooksHandler';

export default async function handler(req: any, res: any) {
  // Extraer sub-ruta desde req.query.route o req.url
  const routeParam = req.query?.route;
  const subpath = Array.isArray(routeParam)
    ? routeParam.join('/')
    : (typeof routeParam === 'string' ? routeParam : '');

  const normalizedPath = (
    subpath ||
    (req.url ? req.url.replace(/^\/api\/v1\/?/, '').split('?')[0] : '')
  ).toLowerCase().replace(/\/$/, '');

  if (normalizedPath === 'simulations') {
    return simulationsHandler(req, res);
  }

  if (normalizedPath === 'applications') {
    return applicationsHandler(req, res);
  }

  if (normalizedPath === 'webhooks') {
    return webhooksHandler(req, res);
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Endpoint '/api/v1/${normalizedPath}' no encontrado.`,
    availableEndpoints: [
      'POST /api/v1/simulations',
      'POST /api/v1/applications',
      'POST /api/v1/webhooks',
    ],
  });
}

export { simulationsHandler, applicationsHandler, webhooksHandler };
