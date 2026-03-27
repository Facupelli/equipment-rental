import { createOwnerContractSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateOwnerContractDto extends createZodDto(createOwnerContractSchema) {}
