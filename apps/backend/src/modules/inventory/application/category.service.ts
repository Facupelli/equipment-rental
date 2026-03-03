import { Injectable } from '@nestjs/common';
import { Category } from '../domain/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { TenantContextService } from 'src/modules/tenant/application/tenant-context.service';
import { CategoryRepositoryPort } from './ports/category.repository.port';

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
