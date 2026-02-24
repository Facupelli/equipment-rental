import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryItemRepositoryPort } from '../domain/ports/inventory.repository.port';
import { CreateInventoryItemDto } from '@repo/schemas';
import { InventoryItem } from '../domain/entities/inventory-item.entity';
import { ProductService } from './product.service';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';

@Injectable()
export class InventoryItemService {
  constructor(
    private readonly inventoryItemRepository: InventoryItemRepositoryPort,
    private readonly productService: ProductService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findById(id: string): Promise<any> {
    return await this.inventoryItemRepository.findById(id);
  }

  async findAll(): Promise<any> {
    return await this.inventoryItemRepository.findAll();
  }

  async save(dto: CreateInventoryItemDto): Promise<string> {
    const tenantId = this.tenantContext.getTenantId();

    if (tenantId === undefined) {
      throw new BadRequestException(
        'No tenant context found. Ensure the request passed through TenantMiddleware, or use `prismaService` directly for system-level operations.',
      );
    }

    const productTrackingType = await this.productService.findTrackingType(dto.productId);

    if (!productTrackingType) {
      throw new BadRequestException('Product not found');
    }

    const item = InventoryItem.create(
      {
        ...dto,
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
