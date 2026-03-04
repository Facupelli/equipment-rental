import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { IsSlugTakenQuery } from './is-slug-taken.query';

@QueryHandler(IsSlugTakenQuery)
export class IsSlugTakenQueryHandler implements IQueryHandler<IsSlugTakenQuery, boolean> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: IsSlugTakenQuery): Promise<boolean> {
    const count = await this.prisma.client.tenant.count({ where: { slug: query.slug } });
    return count > 0;
  }
}
