import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service'; // Assuming you have a global Prisma service
import { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { Category } from '../../domain/entities/category.entity';
import { CategoryMapper } from './mappers/category.mapper';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.client.category.findMany();

    return categories.map(CategoryMapper.toDomain);
  }

  async save(category: Category): Promise<string> {
    const data = CategoryMapper.toPersistence(category);

    const created = await this.prisma.client.category.create({ data });

    return created.id;
  }
}
