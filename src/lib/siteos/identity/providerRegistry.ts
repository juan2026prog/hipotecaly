// ==============================================================================
// SITEOS IDENTITY CORE: Registro y Fábrica de Proveedores de KYC
// ==============================================================================

import { KycProvider } from './types';

class KycProviderRegistry {
  private providers: Map<string, KycProvider> = new Map();
  private defaultProviderName: string = 'mock';

  public register(provider: KycProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  public get(providerName?: string): KycProvider {
    const target = (providerName || this.defaultProviderName).toLowerCase();
    const provider = this.providers.get(target);
    if (!provider) {
      const mock = this.providers.get('mock');
      if (mock) return mock;
      throw new Error(`[KycProviderRegistry] Proveedor '${target}' no registrado y mock no disponible.`);
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

export const kycProviderRegistry = new KycProviderRegistry();
