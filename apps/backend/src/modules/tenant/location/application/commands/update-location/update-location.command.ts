export type UpdateLocationProps = {
  name?: string;
  address?: string | null;
  timezone?: string | null;
  supportsDelivery?: boolean;
  deliveryDefaults?: {
    country: string | null;
    stateRegion: string | null;
    city: string | null;
    postalCode: string | null;
  };
};

export class UpdateLocationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly patch: UpdateLocationProps,
  ) {}
}
