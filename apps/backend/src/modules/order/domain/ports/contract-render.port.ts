export interface IncludedItem {
  name: string;
  quantity: number;
  notes: string | null;
}

export interface EquipmentLine {
  name: string;
  quantity: number;
  includedItems: IncludedItem[];
}

export interface ContractData {
  remito: {
    /** e.g. "Guarida-0001" — tenant name + order number */
    number: string;
    /** Formatted local date string — e.g. "20/3/2026" */
    pickupDate: string;
    /** Formatted local date string — e.g. "23/3/2026" */
    returnDate: string;
    /** Billing units for the rental period */
    jornadas: number;
    /** Formatted total price — e.g. "$ 374.368" */
    agreedPrice: string;
    /** Tenant brand logo used in the PDF header */
    logoUrl: string | null;
    /** Customer full name */
    customerName: string;
    /** Customer national document number */
    documentNumber: string;
  };
  /** Flat list of equipment lines. PRODUCT items produce one line each.
   *  BUNDLE items are expanded into one line per component. */
  equipmentLines: EquipmentLine[];
}

export abstract class ContractRendererPort {
  abstract render(data: ContractData): Promise<Buffer>;
}
