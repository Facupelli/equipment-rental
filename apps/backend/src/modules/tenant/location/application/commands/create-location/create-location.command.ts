export class CreateLocationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly address: string | null,
    public readonly supportsDelivery: boolean,
    public readonly deliveryDefaults: {
      country: string | null;
      stateRegion: string | null;
      city: string | null;
      postalCode: string | null;
    },
  ) {}
}
