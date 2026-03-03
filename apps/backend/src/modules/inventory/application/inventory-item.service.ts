import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateInventoryItemDto,
  GetInventoryItemsQueryDto,
  InventoryItemListItemDto,
  PaginatedDto,
} from '@repo/schemas';
import { InventoryItem } from '../domain/entities/asset.entity';
import { ProductService } from './product.service';
import { TenantContextService } from 'src/modules/tenant/application/tenant-context.service';
import { InventoryItemRepositoryPort } from './ports/inventory.repository.port';
import { InventoryItemQueryPort } from './ports/item-query.port';

@Injectable()
export class InventoryItemService {
  constructor(
    private readonly inventoryItemRepository: InventoryItemRepositoryPort,
    private readonly inventoryQueryRepository: InventoryItemQueryPort,
    private readonly productService: ProductService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findById(id: string): Promise<InventoryItem | null> {
    return await this.inventoryItemRepository.findById(id);
  }

  async findAll(filters: GetInventoryItemsQueryDto): Promise<PaginatedDto<InventoryItemListItemDto>> {
    return await this.inventoryQueryRepository.findAll(filters);
  }

  async save(dto: CreateInventoryItemDto): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();

    const productTrackingType = await this.productService.findTrackingType(dto.productId);

    if (!productTrackingType) {
      throw new BadRequestException('Product not found');
    }

    const item = InventoryItem.create(
      {
        ...dto,
        ownerId: dto.ownerId ?? null,
        serialNumber: dto.serialNumber ? dto.serialNumber : null,
        purchaseDate: dto.purchaseDate ? dto.purchaseDate : null,
        purchaseCost: dto.purchaseCost ? dto.purchaseCost : null,
        blackouts: [],
        tenantId,
      },
      productTrackingType,
    );

    return await this.inventoryItemRepository.save(item);
  }
}
