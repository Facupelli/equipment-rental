export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedDto<T> {
  data: T[];
  meta: PaginationMeta;
}
