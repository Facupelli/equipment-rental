export class AcceptPublicSigningSessionCommand {
  constructor(
    public readonly rawToken: string,
    public readonly declaredFullName: string,
    public readonly declaredDocumentNumber: string,
    public readonly acceptanceTextVersion: string,
    public readonly accepted: boolean,
  ) {}
}
