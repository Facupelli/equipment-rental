export interface OrderAgreementForSigningReadModel {
  orderId: string;
  customerId: string | null;
  customerEmail: string | null;
  buffer: Buffer;
  documentNumber: string;
  fileName: string;
}
