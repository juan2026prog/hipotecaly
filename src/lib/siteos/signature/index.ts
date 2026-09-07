// ==============================================================================
// SITEOS SIGNATURE CORE: Punto de Entrada y Exportaciones
// ==============================================================================

import { signatureProviderRegistry } from './providerRegistry';
import { MockSignatureProvider } from './providers/MockSignatureProvider';
import { FirmaGubSignatureProvider } from './providers/FirmaGubSignatureProvider';

// Registrar proveedores por defecto
export const mockSignatureProvider = new MockSignatureProvider();
export const firmaGubSignatureProvider = new FirmaGubSignatureProvider();

signatureProviderRegistry.register(mockSignatureProvider);
signatureProviderRegistry.register(firmaGubSignatureProvider);

export * from './types';
export * from './hashUtil';
export * from './stateMachine';
export * from './eventBus';
export * from './providerRegistry';
export * from './providers/MockSignatureProvider';
export * from './providers/FirmaGubSignatureProvider';
