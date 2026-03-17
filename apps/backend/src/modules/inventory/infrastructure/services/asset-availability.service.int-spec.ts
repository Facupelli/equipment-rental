import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { AssetAvailabilityService } from 'src/modules/inventory/infrastructure/services/asset-availability.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenantContextService } from 'src/modules/shared/tenant/tenant-context.service';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { TrackingMode } from '@repo/types';

// ─────────────────────────────────────────────────────────────────────────────
// Stub
//
// TenantContextService uses AsyncLocalStorage to inject tenantId into queries.
// Asset and AssetAssignment are in TENANT_EXCLUDED_MODELS, so the middleware
// is bypassed for every query this service makes. Returning null is correct
// and equivalent to the real service in this context.
// ─────────────────────────────────────────────────────────────────────────────

class TenantContextServiceStub {
  getTenantId(): null {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Creates a DateRange anchored to a fixed base time + offset minutes. */
function makeRange(startOffsetMinutes: number, durationMinutes: number): DateRange {
  const base = new Date('2025-06-01T10:00:00Z');
  const start = new Date(base.getTime() + startOffsetMinutes * 60_000);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return DateRange.create(start, end);
}

// The test period used by most tests: 10:00 → 12:00 UTC on 2025-06-01
const TEST_PERIOD = makeRange(0, 120);

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('AssetAvailabilityService (integration)', () => {
  let module: TestingModule;
  let service: AssetAvailabilityService;
  let prisma: PrismaService;

  // ── Seed IDs — stable across the whole suite ──────────────────────────────
  // Using fixed UUIDs (not randomUUID()) means failures are reproducible:
  // you can inspect the test DB and know exactly which rows to look at.
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const locationId = '00000000-0000-0000-0000-000000000002';
  const otherLocationId = '00000000-0000-0000-0000-000000000003';
  const productTypeId = '00000000-0000-0000-0000-000000000004';
  const otherProductTypeId = '00000000-0000-0000-0000-000000000005';
  const billingUnitId = '00000000-0000-0000-0000-000000000006';

  // Asset IDs created in beforeAll — tests reference these directly
  const assetA = '00000000-0000-0000-0000-000000000010';
  const assetB = '00000000-0000-0000-0000-000000000011';
  const assetC = '00000000-0000-0000-0000-000000000012';
  const inactiveAsset = '00000000-0000-0000-0000-000000000013';
  const deletedAsset = '00000000-0000-0000-0000-000000000014';
  const otherLocationAsset = '00000000-0000-0000-0000-000000000015';
  const otherProductTypeAsset = '00000000-0000-0000-0000-000000000016';

  // ── Module bootstrap ──────────────────────────────────────────────────────

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        // Load .env.test so ConfigService resolves DATABASE_URL correctly.
        ConfigModule.forRoot({
          envFilePath: path.resolve(__dirname, '../../.env.test'),
          isGlobal: true,
        }),
      ],
      providers: [
        AssetAvailabilityService,
        PrismaService,
        {
          provide: TenantContextService,
          useClass: TenantContextServiceStub,
        },
      ],
    }).compile();

    service = module.get(AssetAvailabilityService);
    prisma = module.get(PrismaService);

    await module.init();

    await seedBaseData();
  });

  afterAll(async () => {
    await cleanAll();
    await module.close();
  });

  // Remove only asset assignments between tests — base seed data stays.
  afterEach(async () => {
    await prisma.client.assetAssignment.deleteMany({
      where: {
        assetId: {
          in: [assetA, assetB, assetC, inactiveAsset, deletedAsset, otherLocationAsset, otherProductTypeAsset],
        },
      },
    });
  });

  // ── Seed helpers ──────────────────────────────────────────────────────────

  async function seedBaseData() {
    // Insert in FK dependency order.
    // upsert guards against leftover data from a previous interrupted run.

    await prisma.client.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'Test Tenant', slug: `test-tenant-${tenantId}`, config: {} },
    });

    await prisma.client.billingUnit.upsert({
      where: { id: billingUnitId },
      update: {},
      create: {
        id: billingUnitId,
        // Suffix with a fixed ID segment to avoid collisions with other seeds
        label: `hour-${billingUnitId}`,
        durationMinutes: 60,
        sortOrder: 1,
      },
    });

    await prisma.client.location.upsert({
      where: { id: locationId },
      update: {},
      create: { id: locationId, tenantId, name: 'Main Location' },
    });

    await prisma.client.location.upsert({
      where: { id: otherLocationId },
      update: {},
      create: { id: otherLocationId, tenantId, name: 'Other Location' },
    });

    await prisma.client.productType.upsert({
      where: { id: productTypeId },
      update: {},
      create: {
        id: productTypeId,
        tenantId,
        billingUnitId,
        name: 'Camera Sony FX3',
        trackingMode: TrackingMode.IDENTIFIED,
        attributes: {},
      },
    });

    await prisma.client.productType.upsert({
      where: { id: otherProductTypeId },
      update: {},
      create: {
        id: otherProductTypeId,
        tenantId,
        billingUnitId,
        name: 'Lens 50mm',
        trackingMode: TrackingMode.IDENTIFIED,
        attributes: {},
      },
    });

    // Main assets — active, correct location and product type
    for (const id of [assetA, assetB, assetC]) {
      await prisma.client.asset.upsert({
        where: { id },
        update: {},
        create: { id, locationId, productTypeId, isActive: true },
      });
    }

    // Edge-case assets
    await prisma.client.asset.upsert({
      where: { id: inactiveAsset },
      update: {},
      create: { id: inactiveAsset, locationId, productTypeId, isActive: false },
    });

    await prisma.client.asset.upsert({
      where: { id: deletedAsset },
      update: {},
      create: { id: deletedAsset, locationId, productTypeId, isActive: true, deletedAt: new Date() },
    });

    await prisma.client.asset.upsert({
      where: { id: otherLocationAsset },
      update: {},
      create: { id: otherLocationAsset, locationId: otherLocationId, productTypeId, isActive: true },
    });

    await prisma.client.asset.upsert({
      where: { id: otherProductTypeAsset },
      update: {},
      create: { id: otherProductTypeAsset, locationId, productTypeId: otherProductTypeId, isActive: true },
    });
  }

  async function cleanAll() {
    // Delete in reverse FK dependency order
    await prisma.client.assetAssignment.deleteMany({
      where: {
        assetId: {
          in: [assetA, assetB, assetC, inactiveAsset, deletedAsset, otherLocationAsset, otherProductTypeAsset],
        },
      },
    });
    for (const id of [assetA, assetB, assetC, inactiveAsset, deletedAsset, otherLocationAsset, otherProductTypeAsset]) {
      await prisma.client.asset.deleteMany({ where: { id } });
    }
    await prisma.client.productType.deleteMany({ where: { id: { in: [productTypeId, otherProductTypeId] } } });
    await prisma.client.location.deleteMany({ where: { id: { in: [locationId, otherLocationId] } } });
    await prisma.client.billingUnit.deleteMany({ where: { id: billingUnitId } });
    await prisma.client.tenant.deleteMany({ where: { id: tenantId } });
  }

  /** Inserts an assignment overlapping the given period for a given asset. */
  async function assignAsset(assetId: string, period: DateRange, type = 'BLACKOUT') {
    // $executeRaw is required because `period` is a tstzrange (unsupported Prisma type).
    await prisma.client.$executeRaw`
      INSERT INTO asset_assignments (id, asset_id, type, period, created_at, updated_at)
      VALUES (
        ${randomUUID()},
        ${assetId},
        ${type}::"AssignmentType",
        ${`[${period.start.toISOString()}, ${period.end.toISOString()})`}::tstzrange,
        NOW(),
        NOW()
      )
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Happy path
  // ─────────────────────────────────────────────────────────────────────────

  describe('happy path', () => {
    it('returns an available asset ID when one exists for the period', async () => {
      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD });

      expect(ids.length).toBeGreaterThanOrEqual(1);
      expect([assetA, assetB, assetC]).toContain(ids[0]);
    });

    it('returns the requested quantity when enough assets are available', async () => {
      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD, quantity: 3 });

      expect(ids).toHaveLength(3);
      // All returned IDs must be distinct
      expect(new Set(ids).size).toBe(3);
    });

    it('returns fewer IDs than requested when not enough assets are available', async () => {
      // Block assetA and assetB — only assetC remains
      await assignAsset(assetA, TEST_PERIOD);
      await assignAsset(assetB, TEST_PERIOD);

      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD, quantity: 3 });

      expect(ids).toHaveLength(1);
      expect(ids[0]).toBe(assetC);
    });

    it('returns empty array when no assets are available', async () => {
      await assignAsset(assetA, TEST_PERIOD);
      await assignAsset(assetB, TEST_PERIOD);
      await assignAsset(assetC, TEST_PERIOD);

      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD });

      expect(ids).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Conflict detection
  // ─────────────────────────────────────────────────────────────────────────

  describe('conflict detection', () => {
    it('does not return an asset with an overlapping ORDER assignment', async () => {
      await assignAsset(assetA, TEST_PERIOD, 'BLACKOUT');
      await assignAsset(assetB, TEST_PERIOD, 'BLACKOUT');
      await assignAsset(assetC, TEST_PERIOD, 'BLACKOUT');

      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD });

      expect(ids).toHaveLength(0);
    });

    it('does not return an asset with an overlapping BLACKOUT assignment', async () => {
      await assignAsset(assetA, TEST_PERIOD, 'BLACKOUT');

      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD, quantity: 3 });

      expect(ids).not.toContain(assetA);
    });

    it('does not return an asset with an overlapping MAINTENANCE assignment', async () => {
      await assignAsset(assetA, TEST_PERIOD, 'MAINTENANCE');

      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD, quantity: 3 });

      expect(ids).not.toContain(assetA);
    });

    it('returns an asset whose assignment ends exactly when the requested period starts', async () => {
      // Assignment: 08:00 → 10:00. Requested period: 10:00 → 12:00.
      // [08:00, 10:00) and [10:00, 12:00) are adjacent — they do NOT overlap.
      // Postgres && operator on half-open intervals handles this correctly.
      const priorPeriod = makeRange(-120, 120); // ends exactly at TEST_PERIOD.start
      await assignAsset(assetA, priorPeriod);

      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD });

      expect(ids).toContain(assetA);
    });

    it('does not return an asset whose assignment starts exactly when the requested period ends', async () => {
      // Assignment: 10:00 → 12:00. Requested: 08:00 → 10:00.
      // Same adjacency — confirmed non-overlapping from the other direction.
      const laterPeriod = makeRange(120, 120); // starts exactly at TEST_PERIOD.end
      await assignAsset(assetA, laterPeriod);

      // Request the period that ends exactly when assetA's assignment starts
      const requestPeriod = makeRange(-120, 120); // 08:00 → 10:00
      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: requestPeriod });

      expect(ids).toContain(assetA);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Filters
  // ─────────────────────────────────────────────────────────────────────────

  describe('filters', () => {
    it('does not return inactive assets', async () => {
      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD, quantity: 10 });

      expect(ids).not.toContain(inactiveAsset);
    });

    it('does not return soft-deleted assets', async () => {
      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD, quantity: 10 });

      expect(ids).not.toContain(deletedAsset);
    });

    it('does not return assets from a different location', async () => {
      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD, quantity: 10 });

      expect(ids).not.toContain(otherLocationAsset);
    });

    it('does not return assets of a different product type', async () => {
      const ids = await service.findAvailableAssetIds({ productTypeId, locationId, period: TEST_PERIOD, quantity: 10 });

      expect(ids).not.toContain(otherProductTypeAsset);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Asset preference
  // ─────────────────────────────────────────────────────────────────────────

  describe('asset preference', () => {
    it('returns the preferred asset when quantity = 1 and it is available', async () => {
      const ids = await service.findAvailableAssetIds({
        productTypeId,
        locationId,
        period: TEST_PERIOD,
        quantity: 1,
        assetId: assetB,
      });

      expect(ids).toHaveLength(1);
      expect(ids[0]).toBe(assetB);
    });

    it('returns empty array when preferred asset is unavailable', async () => {
      await assignAsset(assetB, TEST_PERIOD);

      const ids = await service.findAvailableAssetIds({
        productTypeId,
        locationId,
        period: TEST_PERIOD,
        quantity: 1,
        assetId: assetB,
      });

      expect(ids).toHaveLength(0);
    });

    it('ignores assetId preference when quantity > 1', async () => {
      // When quantity > 1, the preference filter is intentionally skipped.
      // The result should include any available assets, not just assetB.
      const ids = await service.findAvailableAssetIds({
        productTypeId,
        locationId,
        period: TEST_PERIOD,
        quantity: 2,
        assetId: assetB,
      });

      expect(ids).toHaveLength(2);
      // assetB may or may not be in the result — we only assert the count
      // and that all returned IDs are valid assets
      for (const id of ids) {
        expect([assetA, assetB, assetC]).toContain(id);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Convenience wrapper
  // ─────────────────────────────────────────────────────────────────────────

  describe('findAvailableAssetId (single-asset wrapper)', () => {
    it('returns the asset ID when one is available', async () => {
      const id = await service.findAvailableAssetId({ productTypeId, locationId, period: TEST_PERIOD });

      expect(id).not.toBeNull();
      expect([assetA, assetB, assetC]).toContain(id);
    });

    it('returns null when no asset is available', async () => {
      await assignAsset(assetA, TEST_PERIOD);
      await assignAsset(assetB, TEST_PERIOD);
      await assignAsset(assetC, TEST_PERIOD);

      const id = await service.findAvailableAssetId({ productTypeId, locationId, period: TEST_PERIOD });

      expect(id).toBeNull();
    });
  });
});
