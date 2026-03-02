export abstract class RoleCommandPort {
  abstract create(role: { tenantId: string; name: string; description: string }): Promise<string>;
}
