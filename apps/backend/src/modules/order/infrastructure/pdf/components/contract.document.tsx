import React from 'react';
import { Document, DocumentProps } from '@react-pdf/renderer';
import { ContractData } from 'src/modules/order/domain/ports/contract-render.port';
import { RemitoPage } from './remito-page.component';
import { AnexoPage } from './anexo-page.component';

// ---------------------------------------------------------------------------
// ContractDocument
// ---------------------------------------------------------------------------
// Assembles the full rental contract PDF:
//   - One RemitoPage with the equipment list (the renderer paginates naturally
//     if the list overflows — @react-pdf/renderer inserts continuation pages
//     automatically when `wrap` is enabled on the Page)
//   - One AnexoPage — always the last page, always static
// ---------------------------------------------------------------------------

interface ContractDocumentProps {
  data: ContractData;
}

export function createContractDocument({ data }: ContractDocumentProps): React.ReactElement<DocumentProps> {
  return (
    <Document>
      <RemitoPage data={data} />
      <AnexoPage logoUrl={data.remito.logoUrl} />
    </Document>
  );
}
