import { createMaintenanceAssignmentsSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateMaintenanceAssignmentsRequestDto extends createZodDto(createMaintenanceAssignmentsSchema) {}
