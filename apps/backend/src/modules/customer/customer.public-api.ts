export interface RegisterCustomerPublicInput {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isCompany: boolean | null;
  companyName: string | null;
}

export abstract class CustomerPublicApi {
  abstract register(input: RegisterCustomerPublicInput): Promise<string>;
}
