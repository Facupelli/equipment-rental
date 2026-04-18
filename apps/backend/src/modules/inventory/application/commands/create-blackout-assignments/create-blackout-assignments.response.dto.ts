import { createAssetAssignmentsResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateBlackoutAssignmentsResponseDto extends createZodDto(createAssetAssignmentsResponseSchema) {}
