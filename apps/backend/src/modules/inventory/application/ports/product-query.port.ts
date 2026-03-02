import { GetProductsQueryDto, PaginatedDto, ProductDetailDto, ProductListItemResponseDto } from '@repo/schemas';

export abstract class ProductQueryPort {
  abstract findAll(filters: GetProductsQueryDto): Promise<PaginatedDto<ProductListItemResponseDto>>;
  abstract findById(id: string): Promise<ProductDetailDto | null>;
}
