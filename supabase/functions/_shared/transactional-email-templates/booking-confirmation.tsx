import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface BookingConfirmationProps {
  firstName?: string
  experienceTitle?: string
  category?: string | null
  associationName?: string | null
  startDateLong?: string
  startTime?: string
  endTime?: string
  city?: string | null
  address?: string | null
  description?: string | null
  participantInfo?: string | null
  introText?: string
  closingText?: string
  googleCalendarUrl?: string
  icsDownloadUrl?: string
}

const BookingConfirmationEmail = ({
  firstName,
  experienceTitle = "l'esperienza",
  category,
  associationName,
  startDateLong,
  startTime,
  endTime,
  city,
  address,
  description,
  participantInfo,
  introText,
  closingText,
  googleCalendarUrl,
  icsDownloadUrl,
}: BookingConfirmationProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>La tua prenotazione per {experienceTitle} è confermata</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://cyazgtnjtnyxscfzsasp.supabase.co/storage/v1/object/public/email-assets/bravo-logo-icon.png"
          alt="Bravo!"
          height="28"
          style={logo}
        />
        <Heading style={h1}>Prenotazione confermata</Heading>

        <Text style={paragraph}>
          {introText ||
            `Ciao ${firstName || ''},\nLa tua prenotazione è stata confermata con successo! 😍`}
        </Text>

        <Section style={card}>
          <Heading as="h2" style={h2}>
            {experienceTitle}
          </Heading>

          {category ? (
            <Text style={metaLine}>
              <strong>Categoria:</strong> {category}
            </Text>
          ) : null}
          {associationName ? (
            <Text style={metaLine}>
              <strong>Associazione:</strong> {associationName}
            </Text>
          ) : null}

          {startDateLong ? (
            <Section style={infoBlock}>
              <Text style={metaLine}>
                <strong>📅 Data:</strong> {startDateLong}
              </Text>
              {startTime && endTime ? (
                <Text style={metaLineLast}>
                  <strong>🕐 Orario:</strong> {startTime} - {endTime}
                </Text>
              ) : null}
            </Section>
          ) : null}

          {googleCalendarUrl || icsDownloadUrl ? (
            <Section style={calendarBlock}>
              <Text style={metaLine}>
                <strong>Aggiungi al tuo calendario</strong>
              </Text>
              {googleCalendarUrl ? (
                <Text style={calendarLinkLine}>
                  <a href={googleCalendarUrl} style={link}>
                    📅 Aggiungi a Google Calendar
                  </a>
                </Text>
              ) : null}
              {icsDownloadUrl ? (
                <Text style={calendarLinkLine}>
                  <a href={icsDownloadUrl} style={link}>
                    📥 Scarica per altri calendari (Outlook, Apple, ecc.)
                  </a>
                </Text>
              ) : null}
            </Section>
          ) : null}


          {city || address ? (
            <Section style={blockSpacing}>
              <Text style={metaLine}>
                <strong>📍 Luogo:</strong>
              </Text>
              {city ? <Text style={metaLineSmall}>{city}</Text> : null}
              {address ? <Text style={metaLineMuted}>{address}</Text> : null}
            </Section>
          ) : null}

          {description ? (
            <Section style={descriptionBlock}>
              <Text style={metaLineMuted}>{description}</Text>
            </Section>
          ) : null}

          {participantInfo ? (
            <Section style={infoBlock}>
              <Text style={metaLine}>
                <strong>📋 Informazioni utili:</strong>
              </Text>
              <Text style={participantInfoText}>{participantInfo}</Text>
            </Section>
          ) : null}
        </Section>

        <Text style={paragraph}>
          {closingText ||
            "Ti aspettiamo! Grazie per il tuo impegno nel volontariato.\n\nIl team Bravo! 💜"}
        </Text>

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
  component: BookingConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Volontariato con Bravo! - ${data?.experienceTitle || 'la tua esperienza'}`,
  displayName: 'Conferma prenotazione',
  previewData: {
    firstName: 'Marco',
    experienceTitle: 'Pulizia parco urbano',
    category: 'Ambiente',
    associationName: 'Associazione Verde',
    startDateLong: 'sabato 15 giugno 2026',
    startTime: '09:00',
    endTime: '13:00',
    city: 'Milano',
    address: 'Parco Sempione, ingresso Arco della Pace',
    description: 'Una mattinata di pulizia e cura del parco insieme al team.',
    participantInfo: 'Porta scarpe comode e una bottiglia d’acqua. Guanti forniti.',
    googleCalendarUrl:
      'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Pulizia+parco+urbano+%C2%B7+Associazione+Verde&dates=20260615T070000Z%2F20260615T110000Z&location=Milano%2C+Parco+Sempione',
    icsDownloadUrl:
      'https://example.supabase.co/functions/v1/booking-ics?booking_id=00000000-0000-4000-8000-000000000000',
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
const h2 = { margin: '0 0 16px 0', color: '#373737', fontSize: '18px' }
const paragraph = {
  whiteSpace: 'pre-line' as const,
  margin: '0 0 24px 0',
  fontSize: '14px',
  color: '#4F4F4F',
}
const card = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '24px',
  border: '1px solid #CFCFCF',
  margin: '0 0 24px 0',
}
const infoBlock = {
  padding: '16px',
  borderRadius: '8px',
  margin: '16px 0',
  border: '1px solid #CFCFCF',
}
const blockSpacing = { marginTop: '16px' }
const calendarBlock = {
  padding: '16px',
  borderRadius: '8px',
  margin: '16px 0',
  border: '1px solid #CFCFCF',
}
const calendarLinkLine = { margin: '8px 0 0 0', fontSize: '14px', color: '#4F4F4F' }
const descriptionBlock = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #CFCFCF',
}
const metaLine = { margin: '0 0 12px 0', color: '#4F4F4F', fontSize: '14px' }
const metaLineLast = { margin: '0', color: '#4F4F4F', fontSize: '14px' }
const metaLineSmall = { margin: '4px 0 0 0', color: '#4F4F4F', fontSize: '14px' }
const metaLineMuted = { margin: '4px 0 0 0', color: '#999999', fontSize: '13px' }
const participantInfoText = {
  margin: '0',
  whiteSpace: 'pre-line' as const,
  color: '#4F4F4F',
  fontSize: '14px',
}
const contactLine = {
  margin: '24px 0 0 0',
  fontSize: '13px',
  color: '#999999',
}
const link = { color: '#7A00FF', textDecoration: 'underline' }
