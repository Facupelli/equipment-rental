import { SetMetadata } from '@nestjs/common';

export const IS_PAGINATED_KEY = 'is_paginated';
export const Paginated = () => SetMetadata(IS_PAGINATED_KEY, true);
