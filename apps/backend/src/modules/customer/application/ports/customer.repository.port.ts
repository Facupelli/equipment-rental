import { Prisma } from 'src/generated/prisma/browser';

export abstract class CustomerRepositoryPort {
  abstract save(data: Prisma.CustomerUncheckedCreateInput): Promise<string>;
}
