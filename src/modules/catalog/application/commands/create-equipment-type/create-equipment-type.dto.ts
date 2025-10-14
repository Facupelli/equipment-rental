import { createZodDto } from "nestjs-zod";
import z from "zod";

const CreateEquipmentTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().min(1),
});

export class CreateEquipmentTypeDto extends createZodDto(
  CreateEquipmentTypeSchema
) {}

export class EquipmentTypeResponseDto {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}
