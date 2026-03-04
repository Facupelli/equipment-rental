import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { IsEmailTakenQuery } from './is-email-taken.query';

@QueryHandler(IsEmailTakenQuery)
export class IsEmailTakenQueryHandler implements IQueryHandler<IsEmailTakenQuery, boolean> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: IsEmailTakenQuery): Promise<boolean> {
    const count = await this.prisma.client.user.count({ where: { email: query.email } });
    return count > 0;
  }
}
