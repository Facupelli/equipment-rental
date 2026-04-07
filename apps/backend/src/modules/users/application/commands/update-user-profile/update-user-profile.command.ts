export class UpdateUserProfileCommand {
  public readonly tenantId: string;
  public readonly userId: string;
  public readonly fullName?: string;
  public readonly documentNumber?: string;
  public readonly phone?: string;
  public readonly address?: string;
  public readonly signUrl?: string;

  constructor(props: {
    tenantId: string;
    userId: string;
    fullName?: string;
    documentNumber?: string;
    phone?: string;
    address?: string;
    signUrl?: string;
  }) {
    this.tenantId = props.tenantId;
    this.userId = props.userId;
    this.fullName = props.fullName;
    this.documentNumber = props.documentNumber;
    this.phone = props.phone;
    this.address = props.address;
    this.signUrl = props.signUrl;
  }
}
