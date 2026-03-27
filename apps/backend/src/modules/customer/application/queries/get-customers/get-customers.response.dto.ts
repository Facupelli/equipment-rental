import { CustomerResponseDto, PaginatedDto } from '@repo/schemas';

export type GetCustomersResponseDto = PaginatedDto<CustomerResponseDto>;
