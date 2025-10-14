import { createZodDto } from "nestjs-zod";
import z from "zod";

const CreateCategorySchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    parentId: z.string().optional(),
  })
  .refine((data) => data.name.trim().length > 0, {
    message: "Name cannot be empty",
    path: ["name"],
  })
  .refine((data) => data.parentId.trim().length === 0 || data.parentId, {
    message: "Parent ID cannot be empty",
    path: ["parentId"],
  });

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}

export class CategoryResponseDto {
  id: string;
  name: string;
  description: string;
  parentId: string;
}
