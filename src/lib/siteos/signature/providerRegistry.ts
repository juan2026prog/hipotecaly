// ==============================================================================
// SITEOS SIGNATURE CORE: Registro y Fábrica de Proveedores de Firma Digital
// ==============================================================================

import { SignatureProvider } from './types';

class SignatureProviderRegistry {
  private providers: Map<string, SignatureProvider> = new Map();
  private defaultProviderName: string = 'mock';

  public register(provider: SignatureProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  public get(providerName?: string): SignatureProvider {
    const target = (providerName || this.defaultProviderName).toLowerCase();
    const provider = this.providers.get(target);
    if (!provider) {
      const mock = this.providers.get('mock');
      if (mock) return mock;
      throw new Error(`[SignatureProviderRegistry] Proveedor '${target}' no registrado.`);
    }
    return provider;
  }

  public has(providerName: string): boolean {
    return this.providers.has(providerName.toLowerCase());
  }

  public list(): string[] {
    return Array.from(this.providers.keys());
  }

  public setDefault(providerName: string): void {
    if (this.providers.has(providerName.toLowerCase())) {
      this.defaultProviderName = providerName.toLowerCase();
    }
  }
}

export const signatureProviderRegistry = new SignatureProviderRegistry();
