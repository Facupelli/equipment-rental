import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.schema';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService<Env, true>) {
    const adapter = new PrismaPg({
      connectionString: configService.get('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('📦 Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📦 Database disconnected');
  }
}
