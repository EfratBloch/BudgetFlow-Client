// One place that talks to the server: adds the token, reads JSON and turns every
// error answer (ProblemDetails or the 500 shape) into an ApiError with a readable message.

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const TOKEN_KEY = 'budgetflow.session'

export class ApiError extends Error {
  status: number
  details: Record<string, unknown>

  constructor(status: number, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.details = details
  }
}

let onUnauthorized: (() => void) | null = null

// AuthContext registers a callback so an expired token logs the user out everywhere
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export function readToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw).token as string) : null
  } catch {
    return null
  }
}

export { TOKEN_KEY }

const fallbackMessages: Record<number, string> = {
  400: 'הנתונים שנשלחו אינם תקינים.',
  401: 'צריך להתחבר מחדש.',
  403: 'אין לך הרשאה לפעולה הזו.',
  404: 'הפריט לא נמצא.',
  409: 'הפעולה התנגשה עם המצב הנוכחי.',
  500: 'אירעה תקלה בשרת. נסי שוב בעוד רגע.',
}

async function toError(response: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {}
  try {
    body = await response.json()
  } catch {
    // no JSON body (e.g. a 403 from the authorization middleware)
  }

  // Model validation errors: { errors: { Field: ["message"] } }
  const errors = body.errors as Record<string, string[]> | undefined
  const validation = errors ? Object.values(errors).flat().join(' ') : ''

  const message =
    validation ||
    (body.detail as string) ||
    (body.message as string) ||
    fallbackMessages[response.status] ||
    'משהו השתבש.'

  return new ApiError(response.status, message, body)
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = readToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'אין חיבור לשרת. בדקי שהשרת פועל ונסי שוב.')
  }

  if (response.status === 401 && token && onUnauthorized) onUnauthorized()
  if (!response.ok) throw await toError(response)
  if (response.status === 204) return undefined as T

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

// Builds "?a=1&b=2", skipping empty values
export function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}
