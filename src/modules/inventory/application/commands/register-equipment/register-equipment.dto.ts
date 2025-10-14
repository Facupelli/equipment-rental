import { createZodDto } from "nestjs-zod";
import z from "zod";

const RegisterEquipmentSchema = z.object({
  equipmentTypeId: z.string().min(1),
  serialNumber: z.string().min(1),
});

export class RegisterEquipmentDto extends createZodDto(
  RegisterEquipmentSchema
) {}

export class EquipmentItemResponseDto {
  id: string;
  equipmentTypeId: string;
  serialNumber: string;
  status: string;
}
