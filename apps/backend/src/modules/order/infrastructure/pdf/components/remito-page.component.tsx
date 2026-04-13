import React from 'react';
import { Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { ContractData, EquipmentLine } from 'src/modules/order/domain/ports/contract-render.port';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  remitoNumber: {
    fontSize: 9,
    color: '#555',
    textAlign: 'right',
  },

  // ── Info block ────────────────────────────────────────────────────────────
  infoBox: {
    border: '1pt solid #cccccc',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoRowDouble: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
  },
  infoValue: {
    fontFamily: 'Helvetica-Bold',
  },
  infoNote: {
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },

  // ── Equipment list ────────────────────────────────────────────────────────
  equipmentSection: {
    border: '1pt solid #cccccc',
    borderRadius: 4,
    padding: 12,
  },
  equipmentTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 10,
    borderBottom: '0.5pt solid #cccccc',
    paddingBottom: 6,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  equipmentItem: {
    width: '50%',
    paddingRight: 12,
    marginBottom: 10,
  },
  equipmentName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 2,
  },
  equipmentAccessories: {
    fontSize: 8,
    color: '#444',
    lineHeight: 1.4,
  },

  // ── Footer / signatures ───────────────────────────────────────────────────
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLine: {
    borderBottom: '0.5pt solid #1a1a1a',
    marginBottom: 4,
    height: 24,
  },
  signatureLabel: {
    fontSize: 7.5,
    color: '#333',
    textAlign: 'center',
  },

  // ── Page footer ───────────────────────────────────────────────────────────
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#888',
    borderTop: '0.5pt solid #ddd',
    paddingTop: 4,
  },
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RemitoPageProps {
  data: ContractData;
  /** When equipment overflows a single page, subsequent pages receive only
   *  the continuation lines and suppress the header info block. */
  isContinuation?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RemitoPage({ data, isContinuation = false }: RemitoPageProps) {
  const { remito, equipmentLines } = data;

  return (
    <Page size="A4" style={s.page} wrap>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={s.headerRow} fixed>
        {remito.logoUrl ? <Image style={s.logo} src={remito.logoUrl} /> : <View style={s.logo} />}
        <Text style={s.remitoNumber}>REMITO N° {remito.number}</Text>
      </View>

      {/* ── Info block — only on the first page ───────────────────────────── */}
      {!isContinuation && (
        <View style={s.infoBox}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>FECHA DE RETIRO:</Text>
            <Text style={s.infoValue}>{remito.pickupDate}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>FECHA DE DEVOLUCIÓN:</Text>
            <Text style={s.infoValue}>{remito.returnDate}</Text>
          </View>
          <View style={s.infoRowDouble}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={s.infoLabel}>CANTIDAD DE JORNADAS:</Text>
              <Text style={s.infoValue}>{remito.jornadas}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={s.infoLabel}>PRECIO ACORDADO:</Text>
              <Text style={s.infoValue}>{remito.agreedPrice}</Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>RETIRA:</Text>
            <Text style={s.infoValue}>{remito.customerName}</Text>
            <Text style={[s.infoLabel, { marginLeft: 16 }]}>DNI:</Text>
            <Text style={s.infoValue}>{remito.documentNumber}</Text>
          </View>
          <Text style={s.infoNote}>IMPORTANTE: VER CONDICIONES ANEXO I</Text>
        </View>
      )}

      {/* ── Equipment list ────────────────────────────────────────────────── */}
      <View style={s.equipmentSection}>
        <Text style={s.equipmentTitle}>LISTA DE EQUIPOS RETIRADOS</Text>
        <View style={s.equipmentGrid}>
          {equipmentLines.map((line, index) => (
            <EquipmentLineItem key={index} line={line} />
          ))}
        </View>
      </View>

      {/* ── Signature area ────────────────────────────────────────────────── */}
      <View style={s.signatureRow}>
        <View style={s.signatureBlock}>
          <View style={s.signatureLine} />
          <Text style={s.signatureLabel}>FIRMA DEL RESPONSABLE DE PRODUCCIÓN</Text>
        </View>
        <View style={s.signatureBlock}>
          <View style={s.signatureLine} />
          <Text style={s.signatureLabel}>FIRMA DEL RESPONSABLE DEL RENTAL</Text>
        </View>
      </View>

      {/* ── Page footer ───────────────────────────────────────────────────── */}
      <View style={s.pageFooter} fixed>
        <Text>2026. GUARIDA RENTAL. SAN JUAN, ARGENTINA.</Text>
        <Text>Telefono de contacto: 680 870 274</Text>
        <Text>www.guaridarental.com - guaridarental@gmail.com</Text>
      </View>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Equipment line sub-component
// ---------------------------------------------------------------------------

function EquipmentLineItem({ line }: { line: EquipmentLine }) {
  const accessoryText = line.includedItems
    .map((item) => {
      const qty = `${item.quantity}x ${item.name}`;
      return item.notes ? `${qty} (${item.notes})` : qty;
    })
    .join(', ');

  return (
    <View style={s.equipmentItem} wrap={false}>
      <Text style={s.equipmentName}>
        x{line.quantity} {line.name}
      </Text>
      {accessoryText.length > 0 && <Text style={s.equipmentAccessories}>Con {accessoryText}</Text>}
    </View>
  );
}
