import { GetInventoryItemsQueryDto, PaginatedDto, InventoryItemListItemDto } from '@repo/schemas';

export abstract class InventoryItemQueryPort {
  abstract findAll(filters: GetInventoryItemsQueryDto): Promise<PaginatedDto<InventoryItemListItemDto>>;
}
