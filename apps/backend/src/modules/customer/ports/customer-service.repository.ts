import { Prisma } from 'src/generated/prisma/browser';

export abstract class CustomerRepository {
  abstract save(data: Prisma.CustomerUncheckedCreateInput): Promise<string>;
}
