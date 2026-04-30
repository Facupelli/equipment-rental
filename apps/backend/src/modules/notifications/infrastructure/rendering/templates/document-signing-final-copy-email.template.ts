import { DocumentSigningFinalCopyEmailPayload, RenderedEmail } from '../../../application/ports/email-renderer.port';

const expirationDateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderDocumentSigningFinalCopyEmailTemplate(
  payload: DocumentSigningFinalCopyEmailPayload,
): RenderedEmail {
  const subject = payload.tenantName
    ? `${payload.tenantName}: copia final firmada disponible`
    : 'Copia final firmada disponible';
  const expirationLine = `Este enlace estara disponible hasta ${expirationDateFormatter.format(payload.expiresAt)} UTC.`;

  return {
    subject,
    html: [
      '<p>Hola,</p>',
      `<p>La copia final firmada de tu ${escapeHtml(payload.documentLabel)} ya esta disponible.</p>`,
      `<p>Documento: <strong>${escapeHtml(payload.documentNumber)}</strong></p>`,
      `<p><a href="${escapeHtml(payload.downloadUrl)}">Descargar copia final firmada</a></p>`,
      `<p>${escapeHtml(expirationLine)}</p>`,
      '<p>Por seguridad, este enlace es de un solo uso y es controlado por el backend.</p>',
    ].join(''),
    text: [
      'Hola,',
      '',
      `La copia final firmada de tu ${payload.documentLabel} ya esta disponible.`,
      `Documento: ${payload.documentNumber}`,
      '',
      `Descargar copia final firmada: ${payload.downloadUrl}`,
      expirationLine,
      '',
      'Por seguridad, este enlace es de un solo uso y es controlado por el backend.',
    ].join('\n'),
  };
}
