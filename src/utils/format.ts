// Hebrew labels and number / date formatting, in one place.
import type { BudgetSource, EquipmentStatus, MeetingType, UserRole } from '../api/types'

export const meetingTypeLabel: Record<MeetingType, string> = {
  Activity: 'פעילות',
  Birthday: 'יום הולדת',
  GuidesMeeting: 'מפגש מדריכות',
  SpecialEvent: 'אירוע מיוחד',
}

export const meetingTypeEmoji: Record<MeetingType, string> = {
  Activity: '🎯',
  Birthday: '🎂',
  GuidesMeeting: '🤝',
  SpecialEvent: '✨',
}

export const potLabel: Record<BudgetSource, string> = {
  Activity: 'קופת פעילות',
  Birthday: 'קופת ימי הולדת',
  GuideMeetings: 'קופת מפגשי מדריכות',
  Annual: 'קופה שנתית',
}

export const roleLabel: Record<UserRole, string> = {
  Coordinator: 'רכזת',
  Guide: 'מדריכה',
}

export const equipmentStatusLabel: Record<EquipmentStatus, string> = {
  Available: 'פנוי',
  Taken: 'בהשאלה',
  Maintenance: 'בתיקון',
}

const money = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
export const formatMoney = (value: number) => money.format(value)

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export const dayOfMonth = (iso: string) => new Date(iso).getDate()
export const monthShort = (iso: string) => new Date(iso).toLocaleDateString('he-IL', { month: 'short' })
export const weekday = (iso: string) => new Date(iso).toLocaleDateString('he-IL', { weekday: 'long' })

// "2026-10-20T18:30" for <input type="datetime-local">, in local time
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// First letters of the first two words that start with a letter ("Adi (group)" -> "A")
export const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, ' ')
    .split(/\s+/)
    .filter((part) => /^\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

// The server writes the pot formula in English ("4 x 12 participants + 50 added"); show it in Hebrew
const formulaWords: [RegExp, string][] = [
  [/special meetings/g, 'אירועים מיוחדים'],
  [/participants/g, 'חניכות'],
  [/guides/g, 'מדריכות'],
  [/meetings/g, 'מפגשים'],
  [/\(fixed\)/g, '(קבוע)'],
  [/added/g, 'נוספו'],
  [/transferred/g, 'הועברו'],
  [/ x /g, ' × '],
]
export const formulaInHebrew = (formula: string) =>
  formulaWords.reduce((text, [pattern, word]) => text.replace(pattern, word), formula)

// A stable colour per name, so the same participant always gets the same bubble colour
const palette = ['#0E9F9A', '#14B8C4', '#2BA88A', '#3A86C8', '#7C6CD6', '#E0A526', '#E77E6B', '#4FB3A9']
export function colorFor(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return palette[hash % palette.length]
}
