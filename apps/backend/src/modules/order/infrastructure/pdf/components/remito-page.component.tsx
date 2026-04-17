import React from 'react';
import { Image, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { ContractData, EquipmentLine } from 'src/modules/order/domain/ports/contract-render.port';

const A4_PAGE_SIZE = { width: 595.28, height: 841.89 } as const;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    paddingTop: 8,
    paddingBottom: 38,
    paddingHorizontal: 26,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    minHeight: 34,
  },
  headerLine: {
    flex: 1,
    borderTop: '2pt solid #111111',
  },
  headerCenterEmpty: {
    height: 24,
  },
  logo: {
    width: 145,
    height: 62,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 145,
    height: 62,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerRightContent: {
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  remitoNumber: {
    fontSize: 10,
    color: '#111',
    textAlign: 'right',
    marginBottom: 2,
  },

  frame: {
    border: '2pt solid #111111',
    borderRadius: 14,
    paddingTop: 18,
    paddingHorizontal: 28,
    paddingBottom: 18,
  },
  frameFirstPage: {
    height: 690,
  },
  frameContinuationPage: {
    height: 722,
  },
  frameContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  frameTopContent: {
    flexShrink: 0,
  },
  infoSection: {
    paddingBottom: 0,
  },
  partySection: {
    paddingBottom: 9,
  },
  partyRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  partyCell: {
    width: '47%',
  },
  partyTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 6,
  },
  partyLine: {
    fontSize: 11,
    marginBottom: 3,
  },
  partyLineValue: {
    fontFamily: 'Helvetica-Bold',
  },
  infoRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  infoCell: {
    width: '47%',
  },
  infoInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  infoValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  infoNote: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  sectionDivider: {
    borderTop: '2pt solid #111111',
    marginHorizontal: -28,
    marginVertical: 12,
  },
  divider: {
    borderTop: '2pt solid #111111',
    marginHorizontal: -28,
    marginVertical: 12,
  },

  // ── Equipment list ────────────────────────────────────────────────────────
  equipmentSection: {
    flexGrow: 1,
  },
  equipmentTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    marginBottom: 14,
  },
  equipmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  equipmentColumn: {
    width: '48%',
  },
  equipmentItem: {
    width: '100%',
    paddingRight: 0,
    marginBottom: 11,
  },
  equipmentName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    lineHeight: 1.25,
    marginBottom: 2,
  },
  equipmentAccessories: {
    fontSize: 8.8,
    color: '#111',
    lineHeight: 1.35,
  },

  // ── Footer / signatures ───────────────────────────────────────────────────
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureBlock: {
    width: '38%',
  },
  signatureVisual: {
    position: 'relative',
    height: 40,
    marginBottom: 10,
    justifyContent: 'flex-end',
  },
  signatureLine: {
    borderBottom: '1pt solid #111111',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  signatureImageFrame: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  signatureImage: {
    width: 200,
    height: 200,
    objectFit: 'contain',
  },
  signatureLabel: {
    fontSize: 7.8,
    color: '#111',
    textAlign: 'center',
  },

  // ── Page footer ───────────────────────────────────────────────────────────
  pageFooter: {
    position: 'absolute',
    bottom: 12,
    left: 54,
    right: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#111',
    paddingTop: 4,
  },
  footerText: {
    maxWidth: '33%',
    textAlign: 'center',
    color: '#737373',
  },
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RemitoPageProps {
  data: ContractData;
  columns: {
    left: EquipmentLine[];
    right: EquipmentLine[];
  };
  isContinuation?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RemitoPage({ data, columns, isContinuation = false }: RemitoPageProps) {
  const { remito } = data;

  return (
    <Page size={A4_PAGE_SIZE} style={s.page} wrap={false}>
      {!isContinuation && (
        <View style={s.headerRow} fixed>
          <View />
          <View style={s.headerRight}>
            <View style={s.headerRightContent}>
              <Text style={s.remitoNumber}>REMITO N° {remito.number}</Text>
            </View>
          </View>
        </View>
      )}

      {isContinuation && <View style={s.headerCenterEmpty} />}

      <View style={[s.frame, isContinuation ? s.frameContinuationPage : s.frameFirstPage]}>
        <View style={s.frameContent}>
          <View style={s.frameTopContent}>
            {!isContinuation && (
              <View style={s.infoSection}>
                <View style={s.partySection}>
                  <View style={s.partyRowGrid}>
                    <PartyInfoBlock title="ARRENDADOR" party={remito.landlord} />
                    <PartyInfoBlock title="ARRENDATARIO" party={remito.tenant} />
                  </View>
                </View>

                <View style={s.sectionDivider} />

                <View>
                  <View style={s.infoRowGrid}>
                    <View style={s.infoCell}>
                      <View style={s.infoInline}>
                        <Text style={s.infoLabel}>FECHA DE RETIRO:</Text>
                        <Text style={s.infoValue}>{remito.pickupDate}</Text>
                      </View>
                    </View>
                    <View style={s.infoCell}>
                      <View style={s.infoInline}>
                        <Text style={s.infoLabel}>PRECIO ACORDADO:</Text>
                        <Text style={s.infoValue}>{remito.agreedPrice}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.infoRowGrid}>
                    <View style={s.infoCell}>
                      <View style={s.infoInline}>
                        <Text style={s.infoLabel}>FECHA DE DEVOLUCIÓN:</Text>
                        <Text style={s.infoValue}>{remito.returnDate}</Text>
                      </View>
                    </View>
                    <View style={s.infoCell}>
                      <Text style={s.infoNote}>IMPORTANTE: VER CONDICIONES ANEXO I</Text>
                    </View>
                  </View>

                  <View style={s.infoRowGrid}>
                    <View style={s.infoCell}>
                      <View style={s.infoInline}>
                        <Text style={s.infoLabel}>CANTIDAD DE JORNADAS:</Text>
                        <Text style={s.infoValue}>{remito.jornadas}</Text>
                      </View>
                    </View>
                    <View style={s.infoCell} />
                  </View>
                </View>
              </View>
            )}

            {!isContinuation && <View style={s.divider} />}

            <View style={s.equipmentSection}>
              {!isContinuation && <Text style={s.equipmentTitle}>LISTA DE EQUIPOS RETIRADOS</Text>}
              <View style={s.equipmentGrid}>
                <View style={s.equipmentColumn}>
                  {columns.left.map((line, index) => (
                    <EquipmentLineItem key={`left-${index}`} line={line} />
                  ))}
                </View>
                <View style={s.equipmentColumn}>
                  {columns.right.map((line, index) => (
                    <EquipmentLineItem key={`right-${index}`} line={line} />
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={s.signatureRow}>
            <View style={s.signatureBlock}>
              <View style={s.signatureVisual}>
                <View style={s.signatureLine} />
              </View>
              <Text style={s.signatureLabel}>FIRMA DEL RESPONSABLE DE PRODUCCIÓN</Text>
            </View>
            <View style={s.signatureBlock}>
              <View style={s.signatureVisual}>
                <View style={s.signatureLine} />
                {remito.rentalSignatureUrl && (
                  <View style={s.signatureImageFrame}>
                    <Image src={remito.rentalSignatureUrl} style={s.signatureImage} />
                  </View>
                )}
              </View>
              <Text style={s.signatureLabel}>FIRMA DEL RESPONSABLE DEL RENTAL</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={s.pageFooter} fixed>
        <Text style={s.footerText}>2026. GUARIDA RENTAL. MADRID, ESPAÑA.</Text>
        <Text style={s.footerText}>Telefono de contacto: 680 870 274</Text>
        <Text style={s.footerText}>www.guaridarental.com - guaridarental@gmail.com</Text>
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

function PartyInfoBlock({ title, party }: { title: string; party: ContractData['remito']['landlord'] }) {
  return (
    <View style={s.partyCell}>
      <Text style={s.partyTitle}>{title}</Text>
      <Text style={s.partyLine}>
        <Text style={s.partyLineValue}>{party.fullName}</Text>
      </Text>
      <Text style={s.partyLine}>
        <Text style={s.partyLineValue}>{party.documentNumber}</Text>
      </Text>
      <Text style={s.partyLine}>
        <Text style={s.partyLineValue}>{party.address}</Text>
      </Text>
      <Text style={s.partyLine}>
        <Text style={s.partyLineValue}>{party.phone}</Text>
      </Text>
    </View>
  );
}
