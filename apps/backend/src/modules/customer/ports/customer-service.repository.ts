import { Prisma } from 'src/generated/prisma/browser';

export abstract class CustomerServiceRepository {
  abstract save(data: Prisma.CustomerUncheckedCreateInput): Promise<string>;
}
