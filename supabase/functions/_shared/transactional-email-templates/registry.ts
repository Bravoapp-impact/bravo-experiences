/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as bookingConfirmation } from './booking-confirmation.tsx'
import { template as bookingReminder } from './booking-reminder.tsx'
import { template as feedbackRequest } from './feedback-request.tsx'
import { template as managerAbsenceNotification } from './manager-absence-notification.tsx'
import { template as managerNewBooking } from './manager-new-booking.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmation': bookingConfirmation,
  'booking-reminder': bookingReminder,
  'feedback-request': feedbackRequest,
  'manager-absence-notification': managerAbsenceNotification,
  'manager-new-booking': managerNewBooking,
}
