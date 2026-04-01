import * as dotenv from 'dotenv';
import * as path from 'path';
import { randomUUID } from 'crypto';

import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ActorType,
  OrderStatus,
  Permission,
  PricingRuleEffectType,
  PricingRuleScope,
  PricingRuleType,
} from '@repo/types';
import request, { Test as SupertestRequest } from 'supertest';

import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/core/database/prisma.service';
import { ProblemDetailsFilter } from 'src/core/exceptions/problem-detail.filter';
import { TransformInterceptor } from 'src/core/response/transform.interceptor';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env.test') });

const tenantId = '20000000-0000-0000-0000-000000000001';
const foreignTenantId = '20000000-0000-0000-0000-000000000002';
const locationId = '20000000-0000-0000-0000-000000000003';
const adminRoleId = '20000000-0000-0000-0000-000000000004';
const limitedRoleId = '20000000-0000-0000-0000-000000000005';
const operatorUserId = '20000000-0000-0000-0000-000000000006';
const limitedOperatorUserId = '20000000-0000-0000-0000-000000000007';

describe('Pricing lifecycle HTTP integration', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    jwtService = new JwtService({ secret: process.env.JWT_SECRET });

    app.useGlobalFilters(new ProblemDetailsFilter());
    app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));

    await app.init();
    await seedBaseData();
  });

  afterEach(async () => {
    await prisma.client.couponRedemption.deleteMany({
      where: { coupon: { tenantId: { in: [tenantId, foreignTenantId] } } },
    });
    await prisma.client.order.deleteMany({ where: { tenantId: { in: [tenantId, foreignTenantId] } } });
    await prisma.client.coupon.deleteMany({ where: { tenantId: { in: [tenantId, foreignTenantId] } } });
    await prisma.client.pricingRule.deleteMany({ where: { tenantId: { in: [tenantId, foreignTenantId] } } });
  });

  afterAll(async () => {
    await prisma.client.userRole.deleteMany({ where: { userId: { in: [operatorUserId, limitedOperatorUserId] } } });
    await prisma.client.rolePermission.deleteMany({ where: { roleId: { in: [adminRoleId, limitedRoleId] } } });
    await prisma.client.user.deleteMany({ where: { id: { in: [operatorUserId, limitedOperatorUserId] } } });
    await prisma.client.role.deleteMany({ where: { id: { in: [adminRoleId, limitedRoleId] } } });
    await prisma.client.location.deleteMany({ where: { id: locationId } });
    await prisma.client.tenantOrderSequence.deleteMany({ where: { tenantId: { in: [tenantId, foreignTenantId] } } });
    await prisma.client.tenant.deleteMany({ where: { id: { in: [tenantId, foreignTenantId] } } });
    await app.close();
  });

  it('creates, updates, deactivates, activates, and deletes a pricing rule', async () => {
    const createResponse = await operatorRequest('post', '/pricing/rules', createSeasonalPricingRulePayload()).expect(
      201,
    );
    const pricingRuleId = createResponse.body.data.id as string;

    await operatorRequest('put', `/pricing/rules/${pricingRuleId}`, {
      name: 'Updated duration discount',
      type: PricingRuleType.DURATION,
      scope: PricingRuleScope.ORDER,
      priority: 3,
      stackable: false,
      condition: {
        type: PricingRuleType.DURATION,
        tiers: [
          { fromDays: 1, toDays: 2, discountPct: 10 },
          { fromDays: 3, toDays: null, discountPct: 15 },
        ],
      },
      effect: {
        type: PricingRuleEffectType.PERCENTAGE,
        value: 12,
      },
    }).expect(204);

    let pricingRule = await prisma.client.pricingRule.findUniqueOrThrow({ where: { id: pricingRuleId } });
    expect(pricingRule.name).toBe('Updated duration discount');
    expect(pricingRule.type).toBe(PricingRuleType.DURATION);
    expect(pricingRule.scope).toBe(PricingRuleScope.ORDER);
    expect(pricingRule.priority).toBe(3);
    expect(pricingRule.stackable).toBe(false);
    expect(pricingRule.isActive).toBe(true);

    await operatorRequest('patch', `/pricing/rules/${pricingRuleId}/deactivate`).expect(204);
    pricingRule = await prisma.client.pricingRule.findUniqueOrThrow({ where: { id: pricingRuleId } });
    expect(pricingRule.isActive).toBe(false);

    await operatorRequest('patch', `/pricing/rules/${pricingRuleId}/activate`).expect(204);
    pricingRule = await prisma.client.pricingRule.findUniqueOrThrow({ where: { id: pricingRuleId } });
    expect(pricingRule.isActive).toBe(true);

    await operatorRequest('delete', `/pricing/rules/${pricingRuleId}`).expect(204);
    expect(await prisma.client.pricingRule.findUnique({ where: { id: pricingRuleId } })).toBeNull();
  });

  it('creates, updates, deactivates, activates, and deletes a coupon', async () => {
    const pricingRuleId = await createCouponPricingRule();
    const replacementPricingRuleId = await createCouponPricingRule({ name: 'Replacement coupon rule' });

    const createResponse = await operatorRequest('post', '/pricing/coupons', {
      pricingRuleId,
      code: 'spring20',
      maxUses: 20,
      maxUsesPerCustomer: 2,
      validFrom: new Date('2026-05-01T00:00:00.000Z').toISOString(),
      validUntil: new Date('2026-05-31T00:00:00.000Z').toISOString(),
    }).expect(201);
    const couponId = createResponse.body.data.id as string;

    await operatorRequest('put', `/pricing/coupons/${couponId}`, {
      pricingRuleId: replacementPricingRuleId,
      code: 'summer25',
      maxUses: 30,
      maxUsesPerCustomer: 3,
      validFrom: new Date('2026-06-01T00:00:00.000Z').toISOString(),
      validUntil: new Date('2026-06-30T00:00:00.000Z').toISOString(),
    }).expect(204);

    let coupon = await prisma.client.coupon.findUniqueOrThrow({ where: { id: couponId } });
    expect(coupon.pricingRuleId).toBe(replacementPricingRuleId);
    expect(coupon.code).toBe('SUMMER25');
    expect(coupon.maxUses).toBe(30);
    expect(coupon.maxUsesPerCustomer).toBe(3);
    expect(coupon.isActive).toBe(true);

    await operatorRequest('patch', `/pricing/coupons/${couponId}/deactivate`).expect(204);
    coupon = await prisma.client.coupon.findUniqueOrThrow({ where: { id: couponId } });
    expect(coupon.isActive).toBe(false);

    await operatorRequest('patch', `/pricing/coupons/${couponId}/activate`).expect(204);
    coupon = await prisma.client.coupon.findUniqueOrThrow({ where: { id: couponId } });
    expect(coupon.isActive).toBe(true);

    await operatorRequest('delete', `/pricing/coupons/${couponId}`).expect(204);
    expect(await prisma.client.coupon.findUnique({ where: { id: couponId } })).toBeNull();
  });

  it('returns 409 when updating a coupon to a duplicate code', async () => {
    const pricingRuleId = await createCouponPricingRule();
    await createCoupon(pricingRuleId, { code: 'FIRST' });
    const secondCouponId = await createCoupon(pricingRuleId, { code: 'SECOND' });

    const response = await operatorRequest('put', `/pricing/coupons/${secondCouponId}`, {
      pricingRuleId,
      code: 'FIRST',
      maxUses: 10,
      maxUsesPerCustomer: 1,
    }).expect(409);

    expect(response.body.type).toBe('errors://http-error');
    expect(response.body.detail).toBe('Coupon with code "FIRST" already exists for this tenant.');
  });

  it('returns 409 when deleting a pricing rule that still has coupons', async () => {
    const pricingRuleId = await createCouponPricingRule();
    await createCoupon(pricingRuleId);

    const response = await operatorRequest('delete', `/pricing/rules/${pricingRuleId}`).expect(409);

    expect(response.body.type).toBe('errors://http-error');
    expect(response.body.detail).toBe(`Pricing rule "${pricingRuleId}" cannot be deleted because it has coupons.`);
  });

  it('returns 409 when deleting a coupon that already has redemptions', async () => {
    const pricingRuleId = await createCouponPricingRule();
    const couponId = await createCoupon(pricingRuleId, { code: 'REDEEMED' });
    const orderId = randomUUID();

    await prisma.client.order.create({
      data: {
        id: orderId,
        tenantId,
        locationId,
        couponId,
        status: OrderStatus.CONFIRMED,
        orderNumber: 1,
        periodStart: new Date('2026-07-10T10:00:00.000Z'),
        periodEnd: new Date('2026-07-11T10:00:00.000Z'),
      },
    });

    await prisma.client.couponRedemption.create({
      data: {
        couponId,
        orderId,
        redeemedAt: new Date('2026-07-10T09:00:00.000Z'),
      },
    });

    const response = await operatorRequest('delete', `/pricing/coupons/${couponId}`).expect(409);

    expect(response.body.type).toBe('errors://http-error');
    expect(response.body.detail).toBe(`Coupon "${couponId}" cannot be deleted because it is already in use.`);
  });

  it('returns 404 when trying to mutate a pricing resource from another tenant', async () => {
    const foreignPricingRuleId = await createCouponPricingRule({ tenantId: foreignTenantId, name: 'Foreign rule' });

    const response = await operatorRequest('patch', `/pricing/rules/${foreignPricingRuleId}/deactivate`).expect(404);

    expect(response.body.type).toBe('errors://http-error');
    expect(response.body.detail).toBe(`Pricing rule "${foreignPricingRuleId}" was not found.`);
  });

  it('forbids operators without MANAGE_PRICING permission', async () => {
    const response = await unauthorizedOperatorRequest(
      'post',
      '/pricing/rules',
      createSeasonalPricingRulePayload(),
    ).expect(403);

    expect(response.body.type).toBe('errors://http-error');
    expect(response.body.detail).toBe('You do not have permission to access this resource.');
  });

  async function seedBaseData() {
    for (const [id, name, slug] of [
      [tenantId, 'Pricing Tenant', 'pricing-lifecycle-tenant'],
      [foreignTenantId, 'Foreign Pricing Tenant', 'pricing-lifecycle-foreign-tenant'],
    ] as const) {
      await prisma.client.tenant.upsert({
        where: { id },
        update: { name, slug },
        create: { id, name, slug, config: {} },
      });
    }

    await prisma.client.location.upsert({
      where: { id: locationId },
      update: { tenantId, name: 'Pricing HQ' },
      create: { id: locationId, tenantId, name: 'Pricing HQ' },
    });

    await prisma.client.role.upsert({
      where: { id: adminRoleId },
      update: { tenantId, code: 'PRICING_ADMIN', name: 'Pricing Admin' },
      create: { id: adminRoleId, tenantId, code: 'PRICING_ADMIN', name: 'Pricing Admin' },
    });

    await prisma.client.role.upsert({
      where: { id: limitedRoleId },
      update: { tenantId, code: 'PRICING_VIEWER', name: 'Pricing Viewer' },
      create: { id: limitedRoleId, tenantId, code: 'PRICING_VIEWER', name: 'Pricing Viewer' },
    });

    await prisma.client.user.upsert({
      where: { id: operatorUserId },
      update: {
        tenantId,
        email: 'pricing-admin@example.com',
        passwordHash: 'hashed',
        firstName: 'Pricing',
        lastName: 'Admin',
      },
      create: {
        id: operatorUserId,
        tenantId,
        email: 'pricing-admin@example.com',
        passwordHash: 'hashed',
        firstName: 'Pricing',
        lastName: 'Admin',
      },
    });

    await prisma.client.user.upsert({
      where: { id: limitedOperatorUserId },
      update: {
        tenantId,
        email: 'pricing-viewer@example.com',
        passwordHash: 'hashed',
        firstName: 'Pricing',
        lastName: 'Viewer',
      },
      create: {
        id: limitedOperatorUserId,
        tenantId,
        email: 'pricing-viewer@example.com',
        passwordHash: 'hashed',
        firstName: 'Pricing',
        lastName: 'Viewer',
      },
    });

    await prisma.client.rolePermission.createMany({
      data: [{ roleId: adminRoleId, permission: Permission.MANAGE_PRICING }],
      skipDuplicates: true,
    });

    await prisma.client.userRole.createMany({
      data: [
        { userId: operatorUserId, roleId: adminRoleId, locationId },
        { userId: limitedOperatorUserId, roleId: limitedRoleId, locationId },
      ],
      skipDuplicates: true,
    });
  }

  function createSeasonalPricingRulePayload() {
    return {
      name: 'Spring seasonal discount',
      type: PricingRuleType.SEASONAL,
      scope: PricingRuleScope.ORDER,
      priority: 1,
      stackable: true,
      condition: {
        type: PricingRuleType.SEASONAL,
        dateFrom: new Date('2026-04-01T00:00:00.000Z').toISOString(),
        dateTo: new Date('2026-04-30T23:59:59.000Z').toISOString(),
      },
      effect: {
        type: PricingRuleEffectType.PERCENTAGE,
        value: 8,
      },
    };
  }

  async function createCouponPricingRule(overrides?: { tenantId?: string; name?: string }): Promise<string> {
    const rule = await prisma.client.pricingRule.create({
      data: {
        id: randomUUID(),
        tenantId: overrides?.tenantId ?? tenantId,
        name: overrides?.name ?? 'Coupon rule',
        type: PricingRuleType.COUPON,
        scope: PricingRuleScope.ORDER,
        priority: 1,
        stackable: false,
        isActive: true,
        condition: { type: PricingRuleType.COUPON },
        effect: {
          type: PricingRuleEffectType.PERCENTAGE,
          value: 10,
        },
      },
    });

    return rule.id;
  }

  async function createCoupon(pricingRuleId: string, overrides?: { code?: string }): Promise<string> {
    const coupon = await prisma.client.coupon.create({
      data: {
        id: randomUUID(),
        tenantId,
        pricingRuleId,
        code: overrides?.code ?? `CODE-${randomUUID().slice(0, 8).toUpperCase()}`,
        isActive: true,
      },
    });

    return coupon.id;
  }

  function operatorRequest(
    method: 'post' | 'put' | 'patch' | 'delete',
    url: string,
    body?: string | object,
  ): SupertestRequest {
    return authenticatedRequest(method, url, operatorUserId, body);
  }

  function unauthorizedOperatorRequest(
    method: 'post' | 'put' | 'patch' | 'delete',
    url: string,
    body?: string | object,
  ): SupertestRequest {
    return authenticatedRequest(method, url, limitedOperatorUserId, body);
  }

  function authenticatedRequest(
    method: 'post' | 'put' | 'patch' | 'delete',
    url: string,
    subject: string,
    body?: string | object,
  ): SupertestRequest {
    const req = request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${createToken(subject)}`);

    if (body !== undefined) {
      req.send(body);
    }

    return req;
  }

  function createToken(subject: string): string {
    return jwtService.sign({
      sub: subject,
      email: 'pricing-operator@example.com',
      tenantId,
      actorType: ActorType.USER,
    });
  }
});
