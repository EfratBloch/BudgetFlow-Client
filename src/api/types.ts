// The shapes the API sends and receives (camelCase JSON, enums as text).

export type UserRole = 'Coordinator' | 'Guide'
export type MeetingType = 'Activity' | 'Birthday' | 'GuidesMeeting' | 'SpecialEvent'
export type BudgetSource = 'Activity' | 'Birthday' | 'GuideMeetings' | 'Annual'
export type EquipmentStatus = 'Available' | 'Taken' | 'Maintenance'
export type BudgetAdditionKind = 'Extra' | 'Transfer'

export interface TokenDto {
  token: string
  expiresAt: string
  userId: number
  fullName: string
  role: UserRole
}

export interface UserDto {
  id: number
  email: string
  fullName: string
  phone: string
  nationalId: string
  role: UserRole
  createdAt: string
}

export interface ParticipantDto {
  id: number
  fullName: string
  nationalId: string
  phone: string
  guideId: number
}

export interface BudgetPotDto {
  source: BudgetSource
  label: string
  formula: string
  budget: number
  spent: number
  remaining: number
}

export interface UserBudgetDto {
  userId: number
  fullName: string
  role: UserRole
  pots: BudgetPotDto[]
}

export interface BudgetSummaryDto {
  coordinator: UserBudgetDto
  guides: UserBudgetDto[]
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface MeetingListItemDto {
  id: number
  userId: number
  reporterName: string
  date: string
  type: MeetingType
  program: string
  participantCount: number
  totalExpenses: number
}

export interface ExpenseDto {
  id: number
  amount: number
  description: string
  budgetSource: BudgetSource
}

export interface MeetingDto {
  id: number
  userId: number
  reporterName: string
  date: string
  type: MeetingType
  program: string
  notes?: string | null
  totalExpenses: number
  expenses: ExpenseDto[]
  participants: ParticipantDto[]
}

export interface ExpenseInput {
  amount: number
  description: string
}

export interface MeetingInput {
  type?: MeetingType
  date: string
  program: string
  notes?: string
  participantIds: number[]
  expenses: ExpenseInput[]
  allowBirthdayDraw: boolean
}

export interface GuideOverviewDto {
  guide: UserDto
  participants: ParticipantDto[]
  pots: BudgetPotDto[]
  recentMeetings: PagedResult<MeetingListItemDto>
}

export interface EquipmentDto {
  id: number
  name: string
  description?: string | null
  status: EquipmentStatus
  holderUserId?: number | null
  holderName?: string | null
  takenAt?: string | null
}

export interface BudgetAdditionDto {
  id: number
  guideId: number
  guideName: string
  targetPot: BudgetSource
  amount: number
  reason: string
  kind: BudgetAdditionKind
  fromPot?: BudgetSource | null
  createdAt: string
}
