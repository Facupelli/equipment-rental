import { createAssetAssignmentsResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateMaintenanceAssignmentsResponseDto extends createZodDto(createAssetAssignmentsResponseSchema) {}
