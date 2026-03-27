import { BundleListItemResponseDto, PaginatedDto } from '@repo/schemas';

export type GetBundlesResponseDto = PaginatedDto<BundleListItemResponseDto>;
