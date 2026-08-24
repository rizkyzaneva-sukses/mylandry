import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantId(): string {
  const ctx = tenantStorage.getStore();
  if (!ctx?.tenantId) {
    throw new Error('Tenant context not available. Ensure request is within tenant middleware.');
  }
  return ctx.tenantId;
}

export function withTenantContext<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return tenantStorage.run({ tenantId }, fn);
}
