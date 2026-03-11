export class ResubmitCustomerProfileCommand {
  constructor(
    public readonly customerId: string,
    public readonly fullName: string,
    public readonly phone: string,
    public readonly birthDate: Date,
    public readonly documentNumber: string,
    public readonly identityDocumentPath: string,
    public readonly address: string,
    public readonly city: string,
    public readonly stateRegion: string,
    public readonly country: string,
    public readonly occupation: string,
    public readonly company: string | null,
    public readonly taxId: string | null,
    public readonly businessName: string | null,
    public readonly bankName: string,
    public readonly accountNumber: string,
    public readonly contact1Name: string,
    public readonly contact1Relationship: string,
    public readonly contact2Name: string,
    public readonly contact2Relationship: string,
  ) {}
}
