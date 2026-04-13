import React from 'react';
import { Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    lineHeight: 1.5,
  },

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
  anexoLabel: {
    fontSize: 9,
    color: '#555',
    textAlign: 'right',
  },

  intro: {
    marginBottom: 12,
  },

  clause: {
    marginBottom: 8,
  },

  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
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

  conformityLine: {
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 4,
  },

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
// Static clauses
// ---------------------------------------------------------------------------

const CLAUSES = [
  'El responsable del rental se compromete a brindar en alquiler los equipos listados en perfectas condiciones funcionales en el periodo de fechas establecidas entre retiro y devolución.',
  'El responsable del rental se compromete a asegurar la disponibilidad del equipo solicitado y acordado previamente con el cliente y a la asistencia técnica por WhatsApp. Esta asistencia está reforzada mediante las informaciones técnicas además de la posibilidad de establecer contacto vía mail y/o formulario de la web, www.guaridarental.com. El servicio de operativa, mantenimiento, formación y/o asistencia no está incluída en el alquiler del equipo a no ser que se haya solicitado y aplicado al proyecto, presupuesto, servicio o evento y facturado.',
  'El cliente retira los equipos y la firma de este contrato acompañado del remito es prueba suficiente de conformidad tanto del estado de los equipos como de que se retira la cantidad, tipo y detalle de equipos listados en el remito.',
  'El/los equipos sólo podrán ser utilizado para filmar dentro de la provincia. El traslado eventual y temporario del/los equipos al exterior requerirán autorización expresa y escrita del responsable del rental.',
  'El cliente no podrá ceder, prestar, subalquilar o de cualquier forma compartir o permitir el uso a terceras personas del/los quipos alquilados.',
  'El cliente asume el 100% de la responsabilidad sobre los equipos retirados, haciéndose cargo de reponer de manera íntegra e inmediata el valor total de reposición de cualquier equipamiento dañado parcial o totalmente, hurtado o robado. (consultar valores de reposición al responsable del rental).',
  'Guarida Rental (representado por el responsable del rental) trabaja con equipos robustos y solventes. No obstante en caso de incidencia, la primera opción es contactar con el responsable del rental. El mismo dará las soluciones posibles a la situación sujeto a las posibilidades y disponibilidades en el momento del incidente.',
  'La contratación de un seguro de filmación para los equipos queda totalmente a criterio del cliente, siendo una decisión libre de cada producción a menos que por la cantidad o el valor de los equipos retirados el responsable del rental crea necesario la contratación obligatoria de un seguro. En caso de tener que reclamar la póliza, el responsable de producción se hará cargo de cubrir el valor de reposición de los equipos de manera inmediata, ya que el responsable de rental no recibirá una póliza como válida al momento de reponer equipos dañados parcial o totalmente, hurtados o robados.',
  'El precio acordado del alquiler es pagadero al retiro de equipos por adelantado en el domicilio del rental, al igual que su devolución. En caso de que el responsable del rental crea necesario, se realizara el cobro de una seña que se tendrá en cuenta en el precio acordado del alquiler.',
  'La devolución de equipos se establece en el apartado FECHA DE DEVOLUCIÓN expresado en el remito, con horario límite a las 9am. La demora en la devolución del alquiler pactado devengará al cobro de una jornada adicional, siguiendo el mismo criterio día tras día hasta la devolución. La mora operará en forma automática y sin necesidad de requerimiento alguno. Todo ello independientemente de la acción judicial que el responsable del rental podrá iniciar reclamando la restitución de la cosa por vía ejecutiva.',
  'Para todos los efectos judiciales y extrajudiciales derivados del presente contrato, ambas partes se someten a la competencia ordinaria de los Tribunales de Madrid para todos los efectos derivados de este contrato y renuncian a cualquier otro fuero o jurisdicción que pudiera corresponderles.',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AnexoPageProps {
  logoUrl: string | null;
}

export function AnexoPage({ logoUrl }: AnexoPageProps) {
  return (
    <Page size="A4" style={s.page}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={s.headerRow}>
        {logoUrl ? <Image style={s.logo} src={logoUrl} /> : <View style={s.logo} />}
        <Text style={s.anexoLabel}>ANEXO I</Text>
      </View>

      {/* ── Intro ────────────────────────────────────────────────────────────── */}
      <Text style={s.intro}>
        Este anexo tiene como fin establecer las condiciones de alquiler de equipos solicitados por el cliente, dejando
        claras las responsabilidades de cada parte, y funcionando como contrato entre las partes abajo firmantes.
      </Text>

      {/* ── Clauses ──────────────────────────────────────────────────────────── */}
      {CLAUSES.map((text, index) => (
        <Text key={index} style={s.clause}>
          {index + 1}. {text}
        </Text>
      ))}

      {/* ── Conformity line ──────────────────────────────────────────────────── */}
      <Text style={s.conformityLine}>SE FIRMA ESTE EJEMPLAR EXPRESANDO CONFORMIDAD DE AMBAS PARTES.</Text>

      {/* ── Signatures ───────────────────────────────────────────────────────── */}
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

      {/* ── Page footer ──────────────────────────────────────────────────────── */}
      <View style={s.pageFooter}>
        <Text>2026. GUARIDA RENTAL. SAN JUAN, ARGENTINA.</Text>
        <Text>Telefono de contacto: 680 870 274</Text>
        <Text>www.guaridarental.com - guaridarental@gmail.com</Text>
      </View>
    </Page>
  );
}
