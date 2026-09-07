// ==============================================================================
// SITEOS IDENTITY CORE: Punto de Entrada y Exportaciones
// ==============================================================================

import { kycProviderRegistry } from './providerRegistry';
import { MockKycProvider } from './providers/MockKycProvider';
import { DiditKycProvider } from './providers/DiditKycProvider';

// Registrar proveedores por defecto
export const mockKycProvider = new MockKycProvider();
export const diditKycProvider = new DiditKycProvider();

kycProviderRegistry.register(mockKycProvider);
kycProviderRegistry.register(diditKycProvider);

export * from './types';
export * from './stateMachine';
export * from './eventBus';
export * from './providerRegistry';
export * from './providers/MockKycProvider';
export * from './providers/DiditKycProvider';

