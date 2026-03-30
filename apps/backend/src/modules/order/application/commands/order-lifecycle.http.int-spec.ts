import * as dotenv from 'dotenv';
import * as path from 'path';
import { randomUUID } from 'crypto';

import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ActorType,
  AssignmentSource,
  AssignmentType,
  OrderAssignmentStage,
  OrderItemType,
  OrderStatus,
  TrackingMode,
} from '@repo/types';
import request from 'supertest';

import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/core/database/prisma.service';
import { ProblemDetailsFilter } from 'src/core/exceptions/problem-detail.filter';
import { TransformInterceptor } from 'src/core/response/transform.interceptor';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env.test') });

const tenantId = '10000000-0000-0000-0000-000000000001';
const locationId = '10000000-0000-0000-0000-000000000002';
const productTypeId = '10000000-0000-0000-0000-000000000003';
const billingUnitId = '10000000-0000-0000-0000-000000000004';
const assetId = '10000000-0000-0000-0000-000000000005';

const TEST_PERIOD = {
  start: new Date('2026-04-02T10:00:00.000Z'),
  end: new Date('2026-04-03T10:00:00.000Z'),
};

type CreatedOrder = {
  orderId: string;
  orderItemId: string;
};

describe('Order lifecycle HTTP integration', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const createdOrders: CreatedOrder[] = [];

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
    const orderIds = createdOrders.map((entry) => entry.orderId);
    const orderItemIds = createdOrders.map((entry) => entry.orderItemId);

    if (orderIds.length > 0) {
      await prisma.client.assetAssignment.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.client.orderItem.deleteMany({ where: { id: { in: orderItemIds } } });
      await prisma.client.order.deleteMany({ where: { id: { in: orderIds } } });
      createdOrders.splice(0, createdOrders.length);
    }
  });

  afterAll(async () => {
    await prisma.client.assetAssignment.deleteMany({ where: { assetId } });
    await prisma.client.asset.deleteMany({ where: { id: assetId } });
    await prisma.client.productType.deleteMany({ where: { id: productTypeId } });
    await prisma.client.location.deleteMany({ where: { id: locationId } });
    await prisma.client.billingUnit.deleteMany({ where: { id: billingUnitId } });
    await prisma.client.tenantOrderSequence.deleteMany({ where: { tenantId } });
    await prisma.client.tenant.deleteMany({ where: { id: tenantId } });
    await app.close();
  });

  describe('happy path transitions', () => {
    it('confirms a pending-review order and converts HOLD assignments to COMMITTED', async () => {
      const { orderId } = await createOrderFixture(OrderStatus.PENDING_REVIEW, OrderAssignmentStage.HOLD);

      await operatorRequest(`/orders/${orderId}/confirm`).expect(204);

      await expectOrderStatus(orderId, OrderStatus.CONFIRMED);
      await expectAssignmentStages(orderId, [OrderAssignmentStage.COMMITTED]);
    });

    it('rejects a pending-review order and releases HOLD assignments', async () => {
      const { orderId } = await createOrderFixture(OrderStatus.PENDING_REVIEW, OrderAssignmentStage.HOLD);

      await operatorRequest(`/orders/${orderId}/reject`).expect(204);

      await expectOrderStatus(orderId, OrderStatus.REJECTED);
      await expectAssignmentStages(orderId, []);
    });

    it('cancels a confirmed order and releases COMMITTED assignments', async () => {
      const { orderId } = await createOrderFixture(OrderStatus.CONFIRMED, OrderAssignmentStage.COMMITTED);

      await operatorRequest(`/orders/${orderId}/cancel`).expect(204);

      await expectOrderStatus(orderId, OrderStatus.CANCELLED);
      await expectAssignmentStages(orderId, []);
    });

    it('activates a confirmed order without mutating assignments', async () => {
      const { orderId } = await createOrderFixture(OrderStatus.CONFIRMED, OrderAssignmentStage.COMMITTED);

      await operatorRequest(`/orders/${orderId}/activate`).expect(204);

      await expectOrderStatus(orderId, OrderStatus.ACTIVE);
      await expectAssignmentStages(orderId, [OrderAssignmentStage.COMMITTED]);
    });

    it('completes an active order and preserves assignment history', async () => {
      const { orderId } = await createOrderFixture(OrderStatus.ACTIVE, OrderAssignmentStage.COMMITTED);

      await operatorRequest(`/orders/${orderId}/complete`).expect(204);

      await expectOrderStatus(orderId, OrderStatus.COMPLETED);
      await expectAssignmentStages(orderId, [OrderAssignmentStage.COMMITTED]);
    });
  });

  describe('authorization', () => {
    it.each([
      ['confirm', OrderStatus.PENDING_REVIEW, OrderAssignmentStage.HOLD],
      ['reject', OrderStatus.PENDING_REVIEW, OrderAssignmentStage.HOLD],
      ['cancel', OrderStatus.CONFIRMED, OrderAssignmentStage.COMMITTED],
      ['activate', OrderStatus.CONFIRMED, OrderAssignmentStage.COMMITTED],
      ['complete', OrderStatus.ACTIVE, OrderAssignmentStage.COMMITTED],
    ])('forbids customer access to %s endpoint', async (action, status, stage) => {
      const { orderId } = await createOrderFixture(status, stage);

      const response = await customerRequest(`/orders/${orderId}/${action}`).expect(403);

      expect(response.body.type).toBe('errors://http-error');
      expect(response.body.detail).toBe('This endpoint is restricted to admin users.');
    });
  });

  describe('error handling', () => {
    it.each([
      ['confirm', OrderStatus.CONFIRMED, OrderAssignmentStage.COMMITTED],
      ['reject', OrderStatus.CONFIRMED, OrderAssignmentStage.COMMITTED],
      ['cancel', OrderStatus.PENDING_REVIEW, OrderAssignmentStage.HOLD],
      ['activate', OrderStatus.ACTIVE, OrderAssignmentStage.COMMITTED],
      ['complete', OrderStatus.CONFIRMED, OrderAssignmentStage.COMMITTED],
    ])('returns 422 for invalid %s transitions', async (action, status, stage) => {
      const { orderId } = await createOrderFixture(status, stage);

      const response = await operatorRequest(`/orders/${orderId}/${action}`).expect(422);

      expect(response.body.type).toBe('errors://invalid-order-transition');
      expect(response.body.title).toBe('Invalid Order Transition');
    });

    it.each(['confirm', 'reject', 'cancel', 'activate', 'complete'])(
      'returns 404 when %s target is missing',
      async (action) => {
        const missingOrderId = randomUUID();

        const response = await operatorRequest(`/orders/${missingOrderId}/${action}`).expect(404);

        expect(response.body.type).toBe('errors://http-error');
        expect(response.body.title).toBe('NotFoundException');
        expect(response.body.detail).toBe(`Order "${missingOrderId}" was not found.`);
      },
    );
  });

  async function seedBaseData() {
    await prisma.client.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'Lifecycle Tenant', slug: `lifecycle-${tenantId}`, config: {} },
    });

    await prisma.client.billingUnit.upsert({
      where: { id: billingUnitId },
      update: {},
      create: { id: billingUnitId, label: `day-${billingUnitId}`, durationMinutes: 1440, sortOrder: 1 },
    });

    await prisma.client.location.upsert({
      where: { id: locationId },
      update: {},
      create: { id: locationId, tenantId, name: 'Lifecycle Location' },
    });

    await prisma.client.productType.upsert({
      where: { id: productTypeId },
      update: {},
      create: {
        id: productTypeId,
        tenantId,
        billingUnitId,
        name: 'Lifecycle Camera',
        trackingMode: TrackingMode.IDENTIFIED,
        attributes: {},
      },
    });

    await prisma.client.asset.upsert({
      where: { id: assetId },
      update: {},
      create: { id: assetId, locationId, productTypeId, isActive: true },
    });
  }

  async function createOrderFixture(status: OrderStatus, assignmentStage: OrderAssignmentStage): Promise<CreatedOrder> {
    const orderId = randomUUID();
    const orderItemId = randomUUID();

    createdOrders.push({ orderId, orderItemId });

    await prisma.client.order.create({
      data: {
        id: orderId,
        tenantId,
        locationId,
        status,
        orderNumber: 800000 + createdOrders.length,
        periodStart: TEST_PERIOD.start,
        periodEnd: TEST_PERIOD.end,
      },
    });

    await prisma.client.orderItem.create({
      data: {
        id: orderItemId,
        orderId,
        type: OrderItemType.PRODUCT,
        productTypeId,
        priceSnapshot: {
          currency: 'ARS',
          basePrice: '0',
          finalPrice: '0',
          totalUnits: 1,
          pricePerBillingUnit: '0',
          discounts: [],
        },
      },
    });

    await prisma.client.$executeRaw`
      INSERT INTO asset_assignments (
        id,
        asset_id,
        order_item_id,
        order_id,
        type,
        stage,
        source,
        period,
        created_at,
        updated_at
      ) VALUES (
        ${randomUUID()},
        ${assetId},
        ${orderItemId},
        ${orderId},
        ${AssignmentType.ORDER}::"AssignmentType",
        ${assignmentStage}::"OrderAssignmentStage",
        ${AssignmentSource.OWNED}::"AssignmentSource",
        ${`[${TEST_PERIOD.start.toISOString()}, ${TEST_PERIOD.end.toISOString()})`}::tstzrange,
        NOW(),
        NOW()
      )
    `;

    return { orderId, orderItemId };
  }

  async function expectOrderStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.client.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { status: true },
    });

    expect(order.status).toBe(status);
  }

  async function expectAssignmentStages(orderId: string, expectedStages: OrderAssignmentStage[]) {
    const assignments = await prisma.client.assetAssignment.findMany({
      where: { orderId },
      select: { stage: true },
      orderBy: { createdAt: 'asc' },
    });

    expect(assignments.map((assignment) => assignment.stage)).toEqual(expectedStages);
  }

  function operatorRequest(url: string) {
    return request(app.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${createToken(ActorType.USER)}`);
  }

  function customerRequest(url: string) {
    return request(app.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${createToken(ActorType.CUSTOMER)}`);
  }

  function createToken(actorType: ActorType): string {
    return jwtService.sign({
      sub: randomUUID(),
      email: actorType === ActorType.USER ? 'operator@example.com' : 'customer@example.com',
      tenantId,
      actorType,
    });
  }
});
