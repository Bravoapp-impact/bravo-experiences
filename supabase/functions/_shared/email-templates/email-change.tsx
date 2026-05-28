/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Conferma il cambio email su Bravo!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://cyazgtnjtnyxscfzsasp.supabase.co/storage/v1/object/public/email-assets/bravo-logo-icon.png" alt="Bravo!" height="28" style={logo} />
        <Heading style={h1}>Conferma il cambio email</Heading>
        <Text style={text}>
          Hai richiesto di cambiare il tuo indirizzo email su Bravo! da{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          a{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>
        </Text>
        <Text style={text}>
          Clicca il bottone qui sotto per confermare il cambio:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>
            Conferma nuovo indirizzo
          </Button>
        </Section>
        <Text style={footer}>
          Se non hai richiesto questa modifica, ti consigliamo di mettere in sicurezza il tuo account immediatamente.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const logo = { margin: '24px 0 0 32px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#373737', margin: '16px 32px 16px', padding: '0' }
const text = { fontSize: '15px', color: '#4F4F4F', lineHeight: '1.6', margin: '0 32px 24px' }
const link = { color: '#373737', textDecoration: 'underline' }
const buttonContainer = { textAlign: 'center' as const, margin: '0 32px 24px' }
const button = { backgroundColor: '#222222', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 32px 32px', borderTop: '1px solid #e5e5e5', paddingTop: '16px' }
