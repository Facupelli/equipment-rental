import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service'; // Assuming you have a global Prisma service
import { InventoryItemQueryPort } from '../../domain/ports/item-query.port';
import { GetInventoryItemsQueryDto, InventoryItemListItemDto, PaginatedDto } from '@repo/schemas';
import { InventoryItemStatus, TrackingType } from '@repo/types';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PrismaInventoryItemQueryRepository extends InventoryItemQueryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(filters: GetInventoryItemsQueryDto): Promise<PaginatedDto<InventoryItemListItemDto>> {
    const { search, categoryId, locationId, status, includeRetired, page, limit } = filters;

    const where = this.buildWhere({ search, categoryId, locationId, status, includeRetired });

    const [rawItems, total] = await this.prisma.client.$transaction([
      this.prisma.client.inventoryItem.findMany({
        where,
        include: {
          product: {
            include: { category: true },
          },
          location: true,
          owner: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.inventoryItem.count({ where }),
    ]);

    return {
      data: rawItems.map((item) => ({
        id: item.id,
        serialNumber: item.serialNumber,
        totalQuantity: item.totalQuantity,
        status: item.status as InventoryItemStatus,
        product: {
          id: item.product.id,
          name: item.product.name,
          trackingType: item.product.trackingType as TrackingType,
        },
        category: item.product.category
          ? {
              id: item.product.category.id,
              name: item.product.category.name,
            }
          : null,
        location: {
          id: item.location.id,
          name: item.location.name,
        },
        owner: {
          id: item.owner.id,
          name: item.owner.name,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildWhere({
    search,
    categoryId,
    locationId,
    status,
    includeRetired,
  }: Pick<
    GetInventoryItemsQueryDto,
    'search' | 'categoryId' | 'locationId' | 'status' | 'includeRetired'
  >): Prisma.InventoryItemWhereInput {
    const where: Prisma.InventoryItemWhereInput = {};

    // --- Status filter ---
    // Explicit status takes full precedence.
    // When absent, hide RETIRED items unless the caller opted in.
    if (status) {
      where.status = status;
    } else if (!includeRetired) {
      where.status = { not: 'RETIRED' };
    }

    // --- Scalar filters ---
    if (locationId) where.locationId = locationId;

    // --- Product-level filters (nested) ---
    if (search || categoryId) {
      where.product = {
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [{ name: { contains: search, mode: 'insensitive' } }],
        }),
      };
    }

    // --- Serial number search (on InventoryItem itself) ---
    // search targets both product.name (above) and serialNumber (here).
    // We lift this into a top-level OR so both are checked in one pass.
    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        {
          product: {
            ...(categoryId && { categoryId }),
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
      // Remove the product filter set above — the OR already covers it.
      delete where.product;
    }

    return where;
  }
}
