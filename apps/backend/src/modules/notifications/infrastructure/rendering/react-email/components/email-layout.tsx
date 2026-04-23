import { Body, Column, Container, Head, Hr, Html, Preview, Row, Section, Text } from 'react-email';
import * as React from 'react';

import { sharedEmailStyles } from '../email-theme';

type EmailLayoutProps = {
  previewText?: string;
  headerLabel: string;
  children: React.ReactNode;
};

export function EmailLayout({ previewText, headerLabel, children }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{previewText ?? ''}</Preview>
      <Body style={sharedEmailStyles.body}>
        <Section style={sharedEmailStyles.page}>
          <Container style={sharedEmailStyles.container}>
            <Section style={sharedEmailStyles.sectionPadding}>
              <Row>
                <Column>
                  <Text style={sharedEmailStyles.headerBrand}>Depiqo</Text>
                </Column>
                <Column align="right">
                  <Text style={sharedEmailStyles.headerLabel}>{headerLabel}</Text>
                </Column>
              </Row>
            </Section>

            <Hr style={sharedEmailStyles.divider} />

            <Section style={sharedEmailStyles.sectionPadding}>{children}</Section>

            <Hr style={sharedEmailStyles.divider} />

            <Section style={sharedEmailStyles.sectionPadding}>
              <Row>
                <Column>
                  <Text style={sharedEmailStyles.footerBrand}>Depiqo System</Text>
                  <Text style={sharedEmailStyles.footerDescription}>
                    Software para alquileres, inventario y depósitos.
                  </Text>
                </Column>
                <Column align="right">
                  <Text style={sharedEmailStyles.footerNotice}>
                    Este es un mensaje automático. No respondas este correo.
                  </Text>
                </Column>
              </Row>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
