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

interface CancellationDeadlineReminderProps {
  firstName?: string
  eventDateLong?: string
  cancellationDeadlineLong?: string
  bookingsUrl?: string
}

const CancellationDeadlineReminderEmail = ({
  firstName = '',
  eventDateLong = '',
  cancellationDeadlineLong = '',
  bookingsUrl = 'https://experiences.bravoapp.it/app/bookings',
}: CancellationDeadlineReminderProps) => {
  const greeting = firstName ? `Ciao ${firstName},` : 'Ciao,'
  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>
        Ultimi giorni per annullare la tua prenotazione del {eventDateLong}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://cyazgtnjtnyxscfzsasp.supabase.co/storage/v1/object/public/email-assets/bravo-logo-icon.png"
            alt="Bravo!"
            height="28"
            style={logo}
          />
          <Heading style={h1}>Ultimi giorni per annullare</Heading>

          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            ti ricordiamo che hai prenotato un'esperienza di volontariato per{' '}
            <strong>{eventDateLong}</strong>. Hai ancora tempo fino al{' '}
            <strong>{cancellationDeadlineLong}</strong> per annullare la tua
            prenotazione online dalla tua area personale.
          </Text>
          <Text style={paragraph}>
            Trascorsa questa data il posto sarà confermato in via definitiva e
            non sarà più possibile disdire dall'app.
          </Text>

          <Button href={bookingsUrl} style={button}>
            Vai alle mie prenotazioni
          </Button>

          <Text style={signature}>A presto,<br />Il team Bravo! 💜</Text>

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
}

export const template = {
  component: CancellationDeadlineReminderEmail,
  subject: 'Ultimi giorni per annullare la tua prenotazione',
  displayName: 'Reminder scadenza annullamento (17 giorni)',
  previewData: {
    firstName: 'Giulia',
    eventDateLong: 'lunedì 15 giugno 2026',
    cancellationDeadlineLong: 'lunedì 1 giugno 2026',
    bookingsUrl: 'https://experiences.bravoapp.it/app/bookings',
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
  backgroundColor: '#7A00FF',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  borderRadius: '8px',
  padding: '12px 20px',
  display: 'inline-block',
  margin: '8px 0 16px 0',
}
const signature = { margin: '24px 0 0 0', fontSize: '14px', color: '#4F4F4F' }
const contactLine = { margin: '24px 0 0 0', fontSize: '13px', color: '#999999' }
const link = { color: '#7A00FF', textDecoration: 'underline' }
