import { Heading, Hr, Section, Text } from 'react-email';
import * as React from 'react';

import { emailTheme } from '../../react-email/email-theme';

type OrderCancelledEmailContentProps = {
  tenantName?: string;
  recipientName?: string;
};

const styles = {
  introTitle: {
    margin: '0 0 12px',
    fontSize: '40px',
    lineHeight: '44px',
    fontWeight: 700,
    color: emailTheme.colors.text,
  },
  introText: {
    margin: '0 0 32px',
    fontSize: '18px',
    lineHeight: '30px',
    color: emailTheme.colors.mutedText,
  },
  block: {
    margin: '0 0 28px',
  },
  blockTitle: {
    margin: '0 0 12px',
    fontSize: '18px',
    lineHeight: '28px',
    fontWeight: 700,
    color: emailTheme.colors.text,
  },
  blockText: {
    margin: 0,
    fontSize: '18px',
    lineHeight: '30px',
    color: emailTheme.colors.text,
  },
  divider: {
    borderColor: emailTheme.colors.border,
    margin: '0 0 28px',
  },
};

export function OrderCancelledEmailContent({ tenantName, recipientName }: OrderCancelledEmailContentProps) {
  return (
    <>
      <Heading as="h1" style={styles.introTitle}>
        Tu pedido fue cancelado
      </Heading>
      <Text style={styles.introText}>{buildIntro(recipientName, tenantName)}</Text>

      <Section style={styles.block}>
        <Text style={styles.blockTitle}>Qué significa esto</Text>
        <Text style={styles.blockText}>
          El pedido ha sido cancelado y no se procesará ningún cobro. Si ya realizaste un pago, te
          contactaremos para gestionar el reembolso.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section>
        <Text style={styles.blockTitle}>¿Necesitás ayuda?</Text>
        <Text style={styles.blockText}>
          Si tenés alguna duda o querés realizar un nuevo pedido, estamos para ayudarte.
        </Text>
      </Section>
    </>
  );
}

function buildIntro(recipientName?: string, tenantName?: string): string {
  if (recipientName && tenantName) {
    return `${recipientName}, te informamos que tu pedido con ${tenantName} ha sido cancelado. Lamentamos las molestias ocasionadas.`;
  }

  if (recipientName) {
    return `${recipientName}, te informamos que tu pedido ha sido cancelado. Lamentamos las molestias ocasionadas.`;
  }

  if (tenantName) {
    return `Te informamos que tu pedido con ${tenantName} ha sido cancelado. Lamentamos las molestias ocasionadas.`;
  }

  return 'Te informamos que tu pedido ha sido cancelado. Lamentamos las molestias ocasionadas.';
}
