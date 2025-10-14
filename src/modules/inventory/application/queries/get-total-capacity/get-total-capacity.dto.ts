import { createZodDto } from "nestjs-zod";
import z from "zod";

const GetTotalCapacitySchema = z.object({
  equipmentTypeId: z.string().min(1),
});

export class GetTotalCapacityDto extends createZodDto(GetTotalCapacitySchema) {}

export class TotalCapacityResponseDto {
  capacity: number;
}
