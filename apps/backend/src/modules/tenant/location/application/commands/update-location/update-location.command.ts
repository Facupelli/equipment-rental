export type UpdateLocationProps = {
  name?: string;
  address?: string | null;
};

export class UpdateLocationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly patch: UpdateLocationProps,
  ) {}
}
