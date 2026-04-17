import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { tenantConfigSchema } from '@repo/schemas';
import { err, ok, Result } from 'neverthrow';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import { PrismaService } from 'src/core/database/prisma.service';
import { PriceSnapshot } from 'src/modules/order/domain/value-objects/price-snapshot.value-object';
import { GetTenantAdminSignerProfileQuery } from 'src/modules/users/public/queries/get-tenant-admin-signer-profile.query';
import { GenerateOrderContractQuery, GenerateOrderContractResult } from './generate-order-contract.query';
import {
  ContractData,
  ContractRendererPort,
  EquipmentLine,
  IncludedItem,
} from 'src/modules/order/domain/ports/contract-render.port';
import { OrderNotFoundException } from 'src/modules/order/domain/exceptions/order.exceptions';
import { OrderItemType } from '@repo/types';

type GenerateOrderContractQueryResult = Result<GenerateOrderContractResult, ContractCustomerProfileMissingError>;

@QueryHandler(GenerateOrderContractQuery)
export class GenerateOrderContractService implements IQueryHandler<
  GenerateOrderContractQuery,
  GenerateOrderContractQueryResult
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
    private readonly contractRenderer: ContractRendererPort,
  ) {}

  async execute(query: GenerateOrderContractQuery): Promise<GenerateOrderContractQueryResult> {
    const order = await this.prisma.client.order.findFirst({
      where: { id: query.orderId, tenantId: query.tenantId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                documentNumber: true,
                phone: true,
                address: true,
              },
            },
          },
        },
        items: {
          include: {
            // PRODUCT items — need the product name and included accessories
            productType: {
              select: {
                name: true,
                includedItems: true,
              },
            },
            // BUNDLE items — expand via snapshot components to get stable names
            // and fetch live includedItems from the productType (see ADL note in architecture)
            bundleSnapshot: {
              include: {
                components: {
                  include: {
                    productType: {
                      select: {
                        name: true,
                        includedItems: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: query.tenantId },
      select: {
        name: true,
        logoUrl: true,
        config: true,
      },
    });

    if (!order) {
      throw new OrderNotFoundException(query.orderId);
    }

    if (!tenant) {
      throw new Error(`Tenant "${query.tenantId}" was not found.`);
    }

    // ── Customer profile guard ────────────────────────────────────────────────
    // A document number is legally required on the remito. If the customer has
    // not completed their profile, we cannot generate a valid contract.

    if (!order.customer?.profile?.documentNumber) {
      return err(new ContractCustomerProfileMissingError(order.customer?.id ?? query.orderId));
    }

    const signerProfile = await this.queryBus.execute(new GetTenantAdminSignerProfileQuery(query.tenantId));

    // ── Jornadas ─────────────────────────────────────────────────────────────
    // All items in an order share the same rental period, so totalUnits is
    // consistent across items. We read it from the first item's price snapshot.

    const firstItem = order.items[0];
    const jornadas = firstItem ? PriceSnapshot.fromJSON(firstItem.priceSnapshot).totalUnits : 0;

    // ── Financial snapshot ────────────────────────────────────────────────────

    const tenantConfig = tenantConfigSchema.parse(tenant.config);
    const financialSnapshot = order.financialSnapshot as { total?: string };
    const agreedPrice = formatCurrency(
      Number(financialSnapshot.total ?? 0),
      tenantConfig.pricing.currency,
      tenantConfig.pricing.locale,
    );

    // ── Equipment lines ───────────────────────────────────────────────────────
    // PRODUCT → one line with quantity 1
    // BUNDLE  → one line per snapshot component, using the component's quantity
    //           and live productType.includedItems (stable configuration data)

    const equipmentLines: EquipmentLine[] = order.items.flatMap((item) => {
      if (item.type === OrderItemType.PRODUCT && item.productType) {
        return [
          {
            name: item.productType.name,
            quantity: 1,
            includedItems: parseIncludedItems(item.productType.includedItems),
          },
        ];
      }

      if (item.type === OrderItemType.BUNDLE && item.bundleSnapshot) {
        return item.bundleSnapshot.components.map((component) => ({
          name: component.productType.name,
          quantity: component.quantity,
          includedItems: parseIncludedItems(component.productType.includedItems),
        }));
      }

      return [];
    });

    // ── Assemble contract data ────────────────────────────────────────────────
    const paddedOrderNumber = String(order.orderNumber).padStart(4, '0');
    const remitoNumber = `${tenant.name}-${paddedOrderNumber}`;
    const customerFullName = `${order.customer.firstName} ${order.customer.lastName}`;
    const downloadFileName = buildContractDownloadFileName(customerFullName, paddedOrderNumber);

    const contractData: ContractData = {
      remito: {
        number: remitoNumber,
        pickupDate: formatLocalDate(order.periodStart),
        returnDate: formatLocalDate(order.periodEnd),
        jornadas,
        agreedPrice,
        logoUrl: tenant.logoUrl,
        rentalSignatureUrl: buildBrandingAssetUrl(signerProfile?.signUrl ?? null),
        landlord: {
          fullName: signerProfile?.fullName ?? '',
          documentNumber: signerProfile?.documentNumber ?? '',
          address: signerProfile?.address ?? '',
          phone: signerProfile?.phone ?? '',
        },
        tenant: {
          fullName: customerFullName,
          documentNumber: order.customer.profile.documentNumber,
          address: order.customer.profile.address,
          phone: order.customer.profile.phone,
        },
      },
      equipmentLines,
    };

    const buffer = await this.contractRenderer.render(contractData);

    return ok({ buffer, remitoNumber, downloadFileName });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Formats a Date as "D/M/YYYY" — matches the remito style in the PDF sample */
function formatLocalDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function parseIncludedItems(value: unknown): IncludedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const candidate = item as Record<string, unknown>;

    if (
      typeof candidate.name !== 'string' ||
      typeof candidate.quantity !== 'number' ||
      (candidate.notes !== null && candidate.notes !== undefined && typeof candidate.notes !== 'string')
    ) {
      return [];
    }

    return [
      {
        name: candidate.name,
        quantity: candidate.quantity,
        notes: candidate.notes == null ? null : candidate.notes,
      },
    ];
  });
}

function formatCurrency(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function buildContractDownloadFileName(customerFullName: string, paddedOrderNumber: string): string {
  const normalizedName = customerFullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalizedName.length > 0 ? `${normalizedName}-${paddedOrderNumber}` : paddedOrderNumber;
}

function buildBrandingAssetUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const brandingPublicUrl = process.env.VITE_BRANDING_R2_PUBLIC_URL;

  if (!brandingPublicUrl) {
    return null;
  }

  return `${brandingPublicUrl.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
}
