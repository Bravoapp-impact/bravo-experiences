import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface FeedbackRequestProps {
  firstName?: string
  experienceTitle?: string
  associationName?: string | null
  feedbackUrl?: string
}

const FeedbackRequestEmail = ({
  firstName,
  experienceTitle = "la tua esperienza",
  associationName,
  feedbackUrl = 'https://experiences.bravoapp.it/app/bookings',
}: FeedbackRequestProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Com'è andata con {associationName || experienceTitle}? 💜</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://cyazgtnjtnyxscfzsasp.supabase.co/storage/v1/object/public/email-assets/bravo-logo-icon.png"
          alt="Bravo!"
          height="28"
          style={logo}
        />
        <Heading style={h1}>Ti va di raccontarci come è andata?</Heading>

        <Text style={paragraph}>Ciao {firstName || ''},</Text>
        <Text style={paragraph}>
          Speriamo che la tua esperienza con <strong>{experienceTitle}</strong>{' '}
          sia stata significativa! Il tuo feedback ci aiuta a migliorare e a
          creare esperienze ancora più belle 💜
        </Text>

        <Button href={feedbackUrl} style={button}>
          Lascia il tuo feedback
        </Button>

        <Text style={subtle}>Ci vogliono meno di 2 minuti. Grazie! 🙏</Text>

        <Text style={contactLine}>
          Per supporto scrivici a{' '}
          <a href="mailto:team@bravoapp.it" style={link}>
            team@bravoapp.it
          </a>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FeedbackRequestEmail,
  subject: (data: Record<string, any>) =>
    `Com'è andata con ${data?.associationName || data?.experienceTitle || 'la tua esperienza'}? 💜`,
  displayName: 'Richiesta feedback',
  previewData: {
    firstName: 'Giulia',
    experienceTitle: 'Pulizia parco urbano',
    associationName: 'Associazione Verde',
    feedbackUrl: 'https://experiences.bravoapp.it/app/bookings',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  color: '#4F4F4F',
  lineHeight: '1.6',
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '20px' }
const logo = { marginBottom: '8px' }
const h1 = {
  color: '#373737',
  margin: '0 0 16px 0',
  fontSize: '22px',
  fontWeight: 'bold' as const,
}
const paragraph = { margin: '0 0 16px 0', fontSize: '14px', color: '#4F4F4F' }
const button = {
  display: 'inline-block',
  backgroundColor: '#222222',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '15px',
  margin: '8px 0 24px 0',
}
const subtle = { margin: '0 0 24px 0', color: '#999999', fontSize: '13px' }
const contactLine = { margin: '8px 0 0 0', fontSize: '13px', color: '#999999' }
const link = { color: '#7A00FF', textDecoration: 'underline' }
