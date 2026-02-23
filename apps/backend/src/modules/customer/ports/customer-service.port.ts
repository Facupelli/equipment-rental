import { Prisma } from 'src/generated/prisma/browser';

export abstract class CustomerServicePort {
  abstract create(data: Prisma.CustomerUncheckedCreateInput): Promise<string>;
}
