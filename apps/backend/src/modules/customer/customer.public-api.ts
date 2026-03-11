import { RegisterCustomerDto } from '@repo/schemas';

export type CustomerDto = Omit<RegisterCustomerDto, 'password'> & {
  passwordHash: string;
  tenantId: string;
};

export abstract class CustomerPublicApi {
  abstract register(dto: CustomerDto): Promise<string>;
}
