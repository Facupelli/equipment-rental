import { Injectable } from '@nestjs/common';
import { Category } from '../domain/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryRepositoryPort } from '../domain/ports/category.repository.port';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async create(dto: CreateCategoryDto): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();

    const category = Category.create({ ...dto, tenantId, description: dto.description ?? null });

    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }
}
