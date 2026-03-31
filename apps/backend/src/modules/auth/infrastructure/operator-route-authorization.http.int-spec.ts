import * as dotenv from 'dotenv';
import * as path from 'path';

import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ActorType, Permission } from '@repo/types';
import request from 'supertest';

import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/core/database/prisma.service';
import { ProblemDetailsFilter } from 'src/core/exceptions/problem-detail.filter';
import { TransformInterceptor } from 'src/core/response/transform.interceptor';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.test') });

const tenantId = '30000000-0000-0000-0000-000000000001';
const adminRoleId = '30000000-0000-0000-0000-000000000002';
const limitedRoleId = '30000000-0000-0000-0000-000000000003';
const adminUserId = '30000000-0000-0000-0000-000000000004';
const limitedUserId = '30000000-0000-0000-0000-000000000005';

describe('Operator route authorization HTTP integration', () => {
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
    await seedAuthorizationData();
  });

  afterEach(async () => {
    await prisma.client.location.deleteMany({ where: { tenantId, name: 'Authorized Location' } });
  });

  afterAll(async () => {
    await prisma.client.location.deleteMany({ where: { tenantId } });
    await prisma.client.userRole.deleteMany({ where: { userId: { in: [adminUserId, limitedUserId] } } });
    await prisma.client.rolePermission.deleteMany({ where: { roleId: { in: [adminRoleId, limitedRoleId] } } });
    await prisma.client.user.deleteMany({ where: { id: { in: [adminUserId, limitedUserId] } } });
    await prisma.client.role.deleteMany({ where: { id: { in: [adminRoleId, limitedRoleId] } } });
    await prisma.client.tenant.deleteMany({ where: { id: tenantId } });
    await app.close();
  });

  it('forbids customer actors from launch-critical operator read and mutation routes', async () => {
    const readResponse = await customerRequest('get', '/locations').expect(403);
    expect(readResponse.body.detail).toBe('This endpoint is restricted to staff users.');

    const mutationResponse = await customerRequest('post', '/locations', {
      name: 'Blocked Location',
      address: 'Customer Street',
    }).expect(403);
    expect(mutationResponse.body.detail).toBe('This endpoint is restricted to staff users.');
  });

  it('forbids operators without permission from launch-critical operator read and mutation routes', async () => {
    const readResponse = await limitedOperatorRequest('get', '/locations').expect(403);
    expect(readResponse.body.detail).toBe('You do not have permission to access this resource.');

    const mutationResponse = await limitedOperatorRequest('post', '/locations', {
      name: 'Forbidden Location',
      address: 'Operator Street',
    }).expect(403);
    expect(mutationResponse.body.detail).toBe('You do not have permission to access this resource.');
  });

  it('authorizes tenant admin users through persisted admin role permissions', async () => {
    const locationsResponse = await adminRequest('get', '/locations').expect(200);
    expect(locationsResponse.body.data).toEqual([]);

    const createLocationResponse = await adminRequest('post', '/locations', {
      name: 'Authorized Location',
      address: 'Admin Street',
    }).expect(201);

    expect(typeof createLocationResponse.body.data).toBe('string');
  });

  async function seedAuthorizationData() {
    await prisma.client.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'Authorization Tenant', slug: `authorization-${tenantId}`, config: {} },
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
        email: 'tenant-admin@example.com',
        passwordHash: 'hashed',
        firstName: 'Tenant',
        lastName: 'Admin',
      },
    });

    await prisma.client.user.upsert({
      where: { id: limitedUserId },
      update: {},
      create: {
        id: limitedUserId,
        tenantId,
        email: 'limited-operator@example.com',
        passwordHash: 'hashed',
        firstName: 'Limited',
        lastName: 'Operator',
      },
    });

    await prisma.client.userRole.createMany({
      data: [
        { userId: adminUserId, roleId: adminRoleId },
        { userId: limitedUserId, roleId: limitedRoleId },
      ],
      skipDuplicates: true,
    });
  }

  function adminRequest(method: 'get' | 'post', url: string, body?: Record<string, unknown>) {
    return sendRequest(method, url, createToken(ActorType.USER, adminUserId), body);
  }

  function limitedOperatorRequest(method: 'get' | 'post', url: string, body?: Record<string, unknown>) {
    return sendRequest(method, url, createToken(ActorType.USER, limitedUserId), body);
  }

  function customerRequest(method: 'get' | 'post', url: string, body?: Record<string, unknown>) {
    return sendRequest(method, url, createToken(ActorType.CUSTOMER, 'customer-actor-id'), body);
  }

  function sendRequest(method: 'get' | 'post', url: string, token: string, body?: Record<string, unknown>) {
    const req = request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
    return body ? req.send(body) : req;
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
