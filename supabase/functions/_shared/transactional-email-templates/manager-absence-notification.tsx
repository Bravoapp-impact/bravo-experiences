import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ManagerAbsenceNotificationProps {
  firstName?: string
  lastName?: string
  eventDateLong?: string
  startTime?: string
  endTime?: string
  companyName?: string
}

const ManagerAbsenceNotificationEmail = ({
  firstName = '',
  lastName = '',
  eventDateLong = '',
  startTime = '',
  endTime = '',
  companyName = '',
}: ManagerAbsenceNotificationProps) => {
  const fullName = `${firstName} ${lastName}`.trim()
  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>
        {fullName} sarà assente {eventDateLong} per un'attività di volontariato
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://cyazgtnjtnyxscfzsasp.supabase.co/storage/v1/object/public/email-assets/bravo-logo-icon.png"
            alt="Bravo!"
            height="28"
            style={logo}
          />
          <Heading style={h1}>Comunicazione di assenza</Heading>

          <Text style={paragraph}>Ciao,</Text>
          <Text style={paragraph}>
            ti scriviamo per informarti che <strong>{fullName}</strong> non sarà
            presente in ufficio <strong>{eventDateLong}</strong> dalle{' '}
            <strong>{startTime}</strong> alle <strong>{endTime}</strong> per
            un'attività di volontariato organizzata da {companyName} tramite
            Bravo!.
          </Text>
          <Text style={paragraph}>
            Questo messaggio ti è stato inviato perché {firstName} ha indicato
            il tuo indirizzo come responsabile di riferimento. Se ritieni che ci
            sia un errore, contatta {firstName}.
          </Text>

          <Text style={signature}>A presto,<br />Il team Bravo!</Text>

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
  component: ManagerAbsenceNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Assenza di ${[data?.firstName, data?.lastName].filter(Boolean).join(' ') || 'un collaboratore'} — volontariato aziendale`,
  displayName: 'Notifica assenza al responsabile',
  previewData: {
    firstName: 'Giulia',
    lastName: 'Rossi',
    eventDateLong: 'lunedì 15 giugno 2026',
    startTime: '09:00',
    endTime: '13:00',
    companyName: 'Acme S.p.A.',
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
const signature = { margin: '24px 0 0 0', fontSize: '14px', color: '#4F4F4F' }
const contactLine = { margin: '24px 0 0 0', fontSize: '13px', color: '#999999' }
const link = { color: '#7A00FF', textDecoration: 'underline' }
