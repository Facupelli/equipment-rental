export class PrepareOrderContractForSigningCommand {
  public readonly tenantId: string;
  public readonly orderId: string;
  public readonly recipientEmail: string;
  public readonly rawToken: string;
  public readonly expiresAt: Date;

  constructor(props: { tenantId: string; orderId: string; recipientEmail: string; rawToken: string; expiresAt: Date }) {
    this.tenantId = props.tenantId;
    this.orderId = props.orderId;
    this.recipientEmail = props.recipientEmail;
    this.rawToken = props.rawToken;
    this.expiresAt = props.expiresAt;
  }
}
