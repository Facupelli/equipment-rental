export abstract class UserCommandPort {
  abstract create(user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    roleId: string;
  }): Promise<string>;
}
