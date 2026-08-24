import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

/**
 * List of tenant-scoped models that should have automatic tenantId filtering.
 * Platform models (Tenant, PlatformUser, Plan, Kupon, PesanWaOutbox, OtpVerification)
 * are NOT included here.
 */
const TENANT_MODELS = [
  'user',
  'outlet',
  'layanan',
  'tingkatLayanan',
  'pelanggan',
  'order',
  'pembayaran',
  'subscription',
  'invoice',
  'kuponRedemption',
  'auditLog',
] as const;

/**
 * Create a tenant-scoped Prisma client that automatically filters by tenantId.
 * Uses Prisma Client Extension ($extends) to inject where: { tenantId } on all queries.
 */
export function createTenantDb(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async findFirst({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async findUnique({ args, query }) {
          // findUnique uses unique constraints, tenantId should be in the where clause
          return query(args);
        },
        async findFirstOrThrow({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async findManyOrThrow({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async create({ args, query }) {
          if (isTenantModel(args.model)) {
            args.data = { ...args.data, tenantId };
          }
          return query(args);
        },
        async createMany({ args, query }) {
          if (isTenantModel(args.model)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d) => ({ ...d, tenantId }));
            } else {
              args.data = { ...args.data, tenantId };
            }
          }
          return query(args);
        },
        async update({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async delete({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async deleteMany({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async count({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async aggregate({ args, query }) {
          if (isTenantModel(args.model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
      },
    },
  });
}

function isTenantModel(model: string): boolean {
  return TENANT_MODELS.includes(model.toLowerCase() as (typeof TENANT_MODELS)[number]);
}

/**
 * Platform DB - no tenant filtering, for superadmin operations.
 * Use this for platform-level queries (Tenant, Plan, Invoice approval, etc.)
 */
export const platformDb = prisma;
