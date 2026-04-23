import { Column, Heading, Row, Section, Text } from 'react-email';
import * as React from 'react';
import { FulfillmentMethod, OrderStatus } from '@repo/types';

import { emailTheme } from '../../react-email/email-theme';

type OrderCreatedConfirmationEmailContentProps = {
  orderNumber: number;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
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
  card: {
    marginBottom: '32px',
    padding: '24px 28px',
    borderRadius: '16px',
    backgroundColor: emailTheme.colors.mutedSurface,
    border: `1px solid ${emailTheme.colors.border}`,
  },
  cardLabel: {
    margin: '0 0 10px',
    fontSize: '13px',
    lineHeight: '18px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: emailTheme.colors.mutedText,
  },
  cardPrimaryValue: {
    margin: 0,
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 700,
    color: emailTheme.colors.primary,
  },
  dividerColumn: {
    borderLeft: `1px solid ${emailTheme.colors.border}`,
    paddingLeft: '24px',
  },
  sectionTitle: {
    margin: '0 0 18px',
    fontSize: '18px',
    lineHeight: '28px',
    fontWeight: 700,
    color: emailTheme.colors.text,
  },
  detailRow: {
    padding: '16px 0',
    borderTop: `1px solid ${emailTheme.colors.border}`,
  },
  detailLabel: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '18px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: emailTheme.colors.mutedText,
  },
  detailValue: {
    margin: 0,
    fontSize: '18px',
    lineHeight: '28px',
    color: emailTheme.colors.text,
  },
  detailValueAccent: {
    margin: 0,
    fontSize: '18px',
    lineHeight: '28px',
    color: emailTheme.colors.primary,
  },
  detailSubvalue: {
    margin: '4px 0 0',
    fontSize: '16px',
    lineHeight: '24px',
    color: emailTheme.colors.mutedText,
  },
};

export function OrderCreatedConfirmationEmailContent({
  orderNumber,
  status,
  fulfillmentMethod,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
}: OrderCreatedConfirmationEmailContentProps) {
  return (
    <>
      <Heading as="h1" style={styles.introTitle}>
        ¡Tu pedido fue creado!
      </Heading>
      <Text style={styles.introText}>
        Gracias por elegirnos. Estamos procesando tu pedido y te avisaremos cuando esté listo.
      </Text>

      <Section style={styles.card}>
        <Row>
          <Column width="48%">
            <Text style={styles.cardLabel}>Número de pedido</Text>
            <Text style={styles.cardPrimaryValue}>#{orderNumber}</Text>
          </Column>
          <Column width="52%" style={styles.dividerColumn}>
            <Text style={styles.cardLabel}>Estado</Text>
            <Text style={styles.cardPrimaryValue}>{formatOrderStatus(status)}</Text>
          </Column>
        </Row>
      </Section>

      <Text style={styles.sectionTitle}>Detalle del pedido</Text>

      <DetailRow label="Método de entrega" value={formatFulfillmentMethod(fulfillmentMethod)} />
      <DetailRow label="Retiro" value={pickupDate} secondaryValue={pickupTime} />
      <DetailRow label="Devolución" value={returnDate} secondaryValue={returnTime} />
    </>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  secondaryValue?: string;
  accent?: boolean;
};

function DetailRow({ label, value, secondaryValue, accent = false }: DetailRowProps) {
  return (
    <Section style={styles.detailRow}>
      <Row>
        <Column width="42%">
          <Text style={styles.detailLabel}>{label}</Text>
        </Column>
        <Column width="58%">
          <Text style={accent ? styles.detailValueAccent : styles.detailValue}>{value}</Text>
          {secondaryValue ? <Text style={styles.detailSubvalue}>{secondaryValue}</Text> : null}
        </Column>
      </Row>
    </Section>
  );
}

function formatOrderStatus(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING_REVIEW:
      return 'Pendiente';
    case OrderStatus.CONFIRMED:
      return 'Confirmado';
    case OrderStatus.REJECTED:
      return 'Rechazado';
    case OrderStatus.EXPIRED:
      return 'Expirado';
    case OrderStatus.ACTIVE:
      return 'Activo';
    case OrderStatus.COMPLETED:
      return 'Completado';
    case OrderStatus.CANCELLED:
      return 'Cancelado';
    default:
      return status;
  }
}

function formatFulfillmentMethod(method: FulfillmentMethod): string {
  switch (method) {
    case FulfillmentMethod.PICKUP:
      return 'Retiro en sucursal';
    case FulfillmentMethod.DELIVERY:
      return 'Entrega a domicilio';
    default:
      return method;
  }
}
