import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenancyModule } from 'src/modules/tenant/tenant.module';

@Global()
@Module({
  imports: [TenancyModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
