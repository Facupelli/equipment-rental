export interface PrepareOrderContractForSigningResponseDto {
  sessionId: string;
  documentNumber: string;
  fileName: string;
  unsignedDocumentHash: string;
  reusedExistingSession: boolean;
  pdfBase64: string;
}
