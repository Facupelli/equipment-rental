import { createBlackoutAssignmentsSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateBlackoutAssignmentsRequestDto extends createZodDto(createBlackoutAssignmentsSchema) {}
