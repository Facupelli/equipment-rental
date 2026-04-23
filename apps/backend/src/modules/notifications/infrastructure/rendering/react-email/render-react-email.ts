import { render, toPlainText } from 'react-email';
import * as React from 'react';

import { RenderedEmail } from '../../../application/ports/email-renderer.port';

type RenderReactEmailInput = {
  subject: string;
  component: React.ReactElement;
};

export async function renderReactEmail({ subject, component }: RenderReactEmailInput): Promise<RenderedEmail> {
  const html = await render(component);
  const text = toPlainText(html);

  return {
    subject,
    html,
    text,
  };
}
