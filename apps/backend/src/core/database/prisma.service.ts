import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.schema';
import { PrismaPg } from '@prisma/adapter-pg';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';

type TenantScopedPrismaClient = ReturnType<PrismaService['_buildScopedClient']>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private _client: TenantScopedPrismaClient | undefined;

  constructor(
    readonly configService: ConfigService<Env, true>,
    private readonly tenantContext: TenantContextService,
  ) {
    const adapter = new PrismaPg({
      connectionString: configService.get('DATABASE_URL'),
    });
    super({ adapter, log: ['query'] });
  }

  get client(): TenantScopedPrismaClient {
    if (!this._client) {
      this._client = this._buildScopedClient();
    }
    return this._client;
  }

  async onModuleInit() {
    await this.$connect();
    console.log('📦 Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📦 Database disconnected');
  }

  _buildScopedClient() {
    const getTenantId = (): string => {
      const tenantId = this.tenantContext.getTenantId();
      if (!tenantId) {
        throw new Error(
          'No tenant context found. Ensure the request passed through TenantMiddleware, ' +
            'or use `prismaService` directly for system-level operations.',
        );
      }
      return tenantId;
    };

    // Reusable interceptor functions.
    // Defined as arrow functions so they share the getTenantId closure above.
    const withTenantWhere = ({ args, query }: any) => {
      args.where = { ...args.where, tenantId: getTenantId() };
      return query(args);
    };

    const withTenantData = ({ args, query }: any) => {
      args.data = { ...args.data, tenantId: getTenantId() };
      return query(args);
    };

    const withTenantDataArray = ({ args, query }: any) => {
      const tenantId = getTenantId();
      args.data = (args.data as any[]).map((item) => ({ ...item, tenantId }));
      return query(args);
    };

    const withTenantUpsert = ({ args, query }: any) => {
      const tenantId = getTenantId();
      args.where = { ...args.where, tenantId };
      args.create = { ...args.create, tenantId };
      return query(args);
    };

    // One entry per tenant-scoped model.
    // Static keys are required — Prisma's $extends type system cannot verify
    // a dynamically computed object (e.g. Object.fromEntries), which causes
    // the index signature to collapse to `never`.
    return this.$extends({
      query: {
        user: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
        role: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
        location: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
        owner: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
        product: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
        inventoryItem: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
        customer: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
        promotion: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
        booking: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
        bookingDiscount: {
          findMany: withTenantWhere,
          findFirst: withTenantWhere,
          findFirstOrThrow: withTenantWhere,
          findUnique: withTenantWhere,
          findUniqueOrThrow: withTenantWhere,
          count: withTenantWhere,
          create: withTenantData,
          createMany: withTenantDataArray,
          update: withTenantWhere,
          updateMany: withTenantWhere,
          upsert: withTenantUpsert,
          delete: withTenantWhere,
          deleteMany: withTenantWhere,
        },
      },
    });
  }
}
