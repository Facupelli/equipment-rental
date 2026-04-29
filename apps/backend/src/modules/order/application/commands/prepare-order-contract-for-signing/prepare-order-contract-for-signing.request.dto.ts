import {
  getOrderByIdParamSchema,
  prepareOrderContractForSigningRequestSchema,
  PrepareOrderContractForSigningRequestDto as PrepareOrderContractForSigningRequest,
} from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export type PrepareOrderContractForSigningRequestDto = PrepareOrderContractForSigningRequest;

export class PrepareOrderContractForSigningBodyDto extends createZodDto(prepareOrderContractForSigningRequestSchema) {}

export class PrepareOrderContractForSigningParamDto extends createZodDto(getOrderByIdParamSchema) {}
