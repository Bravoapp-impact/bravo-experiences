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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Reimposta la tua password su Bravo!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://cyazgtnjtnyxscfzsasp.supabase.co/storage/v1/object/public/email-assets/bravo-logo-icon.png" alt="Bravo!" height="28" style={logo} />
        <Heading style={h1}>Reimposta la tua password</Heading>
        <Text style={text}>
          Abbiamo ricevuto una richiesta per reimpostare la password del tuo account Bravo!. Clicca il bottone qui sotto per scegliere una nuova password 👇
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>
            Reimposta password
          </Button>
        </Section>
        <Text style={hint}>
          Se il bottone non funziona, copia e incolla questo link nel tuo browser:
        </Text>
        <Text style={urlText}>
          <Link href={confirmationUrl} style={link}>{confirmationUrl}</Link>
        </Text>
        <Text style={footer}>
          Se non hai richiesto il reset della password, puoi ignorare questa email. La tua password non verrà modificata.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const logo = { margin: '24px 0 0 32px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#373737', margin: '16px 32px 16px', padding: '0' }
const text = { fontSize: '15px', color: '#4F4F4F', lineHeight: '1.6', margin: '0 32px 24px' }
const link = { color: '#373737', textDecoration: 'underline' }
const buttonContainer = { textAlign: 'center' as const, margin: '0 32px 24px' }
const button = { backgroundColor: '#222222', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const hint = { fontSize: '12px', color: '#999999', margin: '0 32px 8px' }
const urlText = { fontSize: '12px', color: '#999999', margin: '0 32px 24px', wordBreak: 'break-all' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '0 32px 32px', borderTop: '1px solid #e5e5e5', paddingTop: '16px' }
