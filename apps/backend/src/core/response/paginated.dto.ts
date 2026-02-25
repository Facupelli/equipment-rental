export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedDto<T> {
  data: T[];
  meta: PaginationMeta;
}
