import React from 'react';
import { DocumentProps, renderToBuffer } from '@react-pdf/renderer';
import { ContractData, ContractRendererPort } from '../../domain/ports/contract-render.port';
import { createContractDocument } from './components/contract.document';

// ---------------------------------------------------------------------------
// ContractRendererAdapter
// ---------------------------------------------------------------------------
// Infrastructure adapter that fulfills the ContractRendererPort using
// @react-pdf/renderer. Registered in order.module.ts bound to CONTRACT_RENDERER.
//
// To swap the renderer (e.g. to Puppeteer), implement a new class against
// ContractRendererPort and update the module binding. Nothing else changes.
// ---------------------------------------------------------------------------

export class ContractRendererAdapter implements ContractRendererPort {
  async render(data: ContractData): Promise<Buffer> {
    const element: React.ReactElement<DocumentProps> = createContractDocument({ data });
    return renderToBuffer(element);
  }
}
