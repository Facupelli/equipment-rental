import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateCategoryDto } from '../../application/dto/create-category.dto';
import { CategoryResponseDto } from '@repo/schemas';
import { CategoryMapper } from '../persistance/mappers/category.mapper';
import { CategoryService } from '../../application/category.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto): Promise<string> {
    return await this.categoryService.create(dto);
  }

  @Get()
  async getAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findAll();
    return categories.map(CategoryMapper.toResponse);
  }
}
