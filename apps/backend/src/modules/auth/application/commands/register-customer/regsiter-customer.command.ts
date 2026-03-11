export class RegisterCustomerCommand {
  constructor(
    public readonly tenantId: string,
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly isCompany: boolean,
    public readonly companyName: string | null,
  ) {}
}
