// Every API endpoint the client uses, one function each.
import { api, query } from './client'
import type {
  BudgetAdditionDto,
  BudgetAdditionKind,
  BudgetSource,
  BudgetSummaryDto,
  EquipmentDto,
  EquipmentStatus,
  GuideOverviewDto,
  MeetingDto,
  MeetingInput,
  MeetingListItemDto,
  MeetingType,
  PagedResult,
  ParticipantDto,
  TokenDto,
  UserBudgetDto,
  UserDto,
} from './types'

export interface PersonInput {
  fullName: string
  phone: string
}

// Auth
export const login = (email: string, password: string) =>
  api<TokenDto>('/api/auth/login', { method: 'POST', body: { email, password } })

export const registerCoordinator = (body: PersonInput & { email: string; password: string }) =>
  api<UserDto>('/api/auth/register', { method: 'POST', body })

// Users (guides)
export const getGuides = (page: number, pageSize: number, sort: string) =>
  api<PagedResult<UserDto>>(`/api/users${query({ page, pageSize, sort })}`)

export const getUser = (id: number) => api<UserDto>(`/api/users/${id}`)

export const createGuide = (body: PersonInput & { email: string; initialPassword: string }) =>
  api<UserDto>('/api/users', { method: 'POST', body })

export const updateGuide = (id: number, body: PersonInput & { email: string }) =>
  api<void>(`/api/users/${id}`, { method: 'PUT', body })

export const deleteGuide = (id: number) => api<void>(`/api/users/${id}`, { method: 'DELETE' })

export const getOverview = (id: number | 'me') => api<GuideOverviewDto>(`/api/users/${id}/overview`)

// Participants
export const getParticipants = (guideId: number) =>
  api<ParticipantDto[]>(`/api/users/${guideId}/participants`)

export const createParticipant = (guideId: number, body: PersonInput) =>
  api<ParticipantDto>(`/api/users/${guideId}/participants`, { method: 'POST', body })

export const updateParticipant = (id: number, body: PersonInput) =>
  api<void>(`/api/participants/${id}`, { method: 'PUT', body })

export const deleteParticipant = (id: number) => api<void>(`/api/participants/${id}`, { method: 'DELETE' })

// Meetings
export interface MeetingFilter {
  userId?: number
  guidesOnly?: boolean
  type?: MeetingType | ''
  from?: string
  to?: string
  sort?: 'date_desc' | 'date_asc'
  page: number
  pageSize: number
}

export const getMeetings = (filter: MeetingFilter) =>
  api<PagedResult<MeetingListItemDto>>(`/api/meetings${query({ ...filter, guidesOnly: filter.guidesOnly ? 'true' : undefined })}`)

export const getMeeting = (id: number) => api<MeetingDto>(`/api/meetings/${id}`)

export const createMeeting = (body: MeetingInput) =>
  api<MeetingDto>('/api/meetings', { method: 'POST', body })

export const updateMeeting = (id: number, body: MeetingInput) =>
  api<void>(`/api/meetings/${id}`, { method: 'PUT', body })

export const deleteMeeting = (id: number) => api<void>(`/api/meetings/${id}`, { method: 'DELETE' })

// Budget
export const getMyBudget = () => api<UserBudgetDto>('/api/budget/me')
export const getUserBudget = (userId: number) => api<UserBudgetDto>(`/api/users/${userId}/budget`)
export const getBudgetSummary = () => api<BudgetSummaryDto>('/api/budget/summary')

export const getBudgetAdditions = (guideId?: number) =>
  api<BudgetAdditionDto[]>(`/api/budget-additions${query({ guideId })}`)

export const createBudgetAddition = (
  guideId: number,
  body: { targetPot: BudgetSource; amount: number; reason: string; kind: BudgetAdditionKind; fromPot?: BudgetSource },
) => api<BudgetAdditionDto>(`/api/users/${guideId}/budget-additions`, { method: 'POST', body })

export const deleteBudgetAddition = (id: number) =>
  api<void>(`/api/budget-additions/${id}`, { method: 'DELETE' })

// Equipment
export const getEquipment = (status?: EquipmentStatus | '') =>
  api<EquipmentDto[]>(`/api/equipment${query({ status })}`)

export const createEquipment = (body: { name: string; description?: string }) =>
  api<EquipmentDto>('/api/equipment', { method: 'POST', body })

export const updateEquipment = (id: number, body: { name: string; description?: string; inMaintenance: boolean }) =>
  api<void>(`/api/equipment/${id}`, { method: 'PUT', body })

export const deleteEquipment = (id: number) => api<void>(`/api/equipment/${id}`, { method: 'DELETE' })

export const takeEquipment = (id: number) => api<void>(`/api/equipment/${id}/holder`, { method: 'PUT' })

export const returnEquipment = (id: number) => api<void>(`/api/equipment/${id}/holder`, { method: 'DELETE' })
