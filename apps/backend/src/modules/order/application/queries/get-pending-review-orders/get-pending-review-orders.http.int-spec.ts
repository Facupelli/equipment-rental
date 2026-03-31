import * as dotenv from 'dotenv';
import * as path from 'path';

import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ActorType, OrderStatus, Permission } from '@repo/types';
import request from 'supertest';

import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/core/database/prisma.service';
import { ProblemDetailsFilter } from 'src/core/exceptions/problem-detail.filter';
import { TransformInterceptor } from 'src/core/response/transform.interceptor';

dotenv.config({ path: path.resolve(__dirname, '../../../../../../.env.test') });

const tenantId = '40000000-0000-0000-0000-000000000001';
const locationId = '40000000-0000-0000-0000-000000000002';
const pendingOrderId = '40000000-0000-0000-0000-000000000003';
const adminRoleId = '40000000-0000-0000-0000-000000000004';
const limitedRoleId = '40000000-0000-0000-0000-000000000005';
const adminUserId = '40000000-0000-0000-0000-000000000006';
const limitedUserId = '40000000-0000-0000-0000-000000000007';

describe('Pending review orders HTTP integration', () => {
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
    await seedPendingReviewData();
  });

  afterAll(async () => {
    await prisma.client.order.deleteMany({ where: { id: pendingOrderId } });
    await prisma.client.location.deleteMany({ where: { id: locationId } });
    await prisma.client.userRole.deleteMany({ where: { userId: { in: [adminUserId, limitedUserId] } } });
    await prisma.client.rolePermission.deleteMany({ where: { roleId: { in: [adminRoleId, limitedRoleId] } } });
    await prisma.client.user.deleteMany({ where: { id: { in: [adminUserId, limitedUserId] } } });
    await prisma.client.role.deleteMany({ where: { id: { in: [adminRoleId, limitedRoleId] } } });
    await prisma.client.tenantOrderSequence.deleteMany({ where: { tenantId } });
    await prisma.client.tenant.deleteMany({ where: { id: tenantId } });
    await app.close();
  });

  it('returns pending review orders for an authorized operator', async () => {
    const response = await operatorRequest(adminUserId, '/orders/pending-review').expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(pendingOrderId);
    expect(response.body.data[0].status).toBe(OrderStatus.PENDING_REVIEW);
  });

  it('forbids customer actors from the pending review queue', async () => {
    const response = await customerRequest('/orders/pending-review').expect(403);

    expect(response.body.detail).toBe('This endpoint is restricted to staff users.');
  });

  it('forbids operators without order view permission from the pending review queue', async () => {
    const response = await operatorRequest(limitedUserId, '/orders/pending-review').expect(403);

    expect(response.body.detail).toBe('You do not have permission to access this resource.');
  });

  async function seedPendingReviewData() {
    await prisma.client.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'Pending Review Tenant', slug: `pending-review-${tenantId}`, config: {} },
    });

    await prisma.client.location.upsert({
      where: { id: locationId },
      update: {},
      create: { id: locationId, tenantId, name: 'Pending Review Location' },
    });

    await prisma.client.role.upsert({
      where: { id: adminRoleId },
      update: { tenantId, code: 'TENANT_ADMIN', name: 'Admin' },
      create: { id: adminRoleId, tenantId, code: 'TENANT_ADMIN', name: 'Admin' },
    });

    await prisma.client.role.upsert({
      where: { id: limitedRoleId },
      update: { tenantId, code: 'LIMITED_OPERATOR', name: 'Limited Operator' },
      create: { id: limitedRoleId, tenantId, code: 'LIMITED_OPERATOR', name: 'Limited Operator' },
    });

    await prisma.client.rolePermission.createMany({
      data: Object.values(Permission).map((permission) => ({ roleId: adminRoleId, permission })),
      skipDuplicates: true,
    });

    await prisma.client.rolePermission.createMany({
      data: [{ roleId: limitedRoleId, permission: Permission.VIEW_PRODUCTS }],
      skipDuplicates: true,
    });

    await prisma.client.user.upsert({
      where: { id: adminUserId },
      update: {},
      create: {
        id: adminUserId,
        tenantId,
        email: 'pending-admin@example.com',
        passwordHash: 'hashed',
        firstName: 'Pending',
        lastName: 'Admin',
      },
    });

    await prisma.client.user.upsert({
      where: { id: limitedUserId },
      update: {},
      create: {
        id: limitedUserId,
        tenantId,
        email: 'pending-limited@example.com',
        passwordHash: 'hashed',
        firstName: 'Pending',
        lastName: 'Limited',
      },
    });

    await prisma.client.userRole.createMany({
      data: [
        { userId: adminUserId, roleId: adminRoleId },
        { userId: limitedUserId, roleId: limitedRoleId },
      ],
      skipDuplicates: true,
    });

    await prisma.client.order.upsert({
      where: { id: pendingOrderId },
      update: {},
      create: {
        id: pendingOrderId,
        tenantId,
        locationId,
        status: OrderStatus.PENDING_REVIEW,
        orderNumber: 910001,
        periodStart: new Date('2026-05-01T10:00:00.000Z'),
        periodEnd: new Date('2026-05-02T10:00:00.000Z'),
      },
    });
  }

  function operatorRequest(userId: string, url: string) {
    const token = createToken(ActorType.USER, userId);
    return request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`);
  }

  function customerRequest(url: string) {
    const token = createToken(ActorType.CUSTOMER, 'pending-customer-id');
    return request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`);
  }

  function createToken(actorType: ActorType, subject: string): string {
    return jwtService.sign({
      sub: subject,
      email: actorType === ActorType.USER ? 'operator@example.com' : 'customer@example.com',
      tenantId,
      actorType,
    });
  }
});
