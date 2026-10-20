// Who is logged in. The session (token + name + role) is kept in localStorage so a refresh
// keeps the user logged in; an expired token or a 401 from the server logs her out.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler, TOKEN_KEY } from '../api/client'
import * as endpoints from '../api/endpoints'
import type { TokenDto } from '../api/types'

interface AuthState {
  session: TokenDto | null
  isCoordinator: boolean
  login: (email: string, password: string) => Promise<TokenDto>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function loadSession(): TokenDto | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as TokenDto
    return new Date(session.expiresAt).getTime() > Date.now() ? session : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TokenDto | null>(loadSession)

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // storage not available - nothing to clear
    }
    setSession(null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await endpoints.login(email, password)
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(result))
    } catch {
      // private mode: the session lasts until the page is closed
    }
    setSession(result)
    return result
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Log out exactly when the token expires
  useEffect(() => {
    if (!session) return
    const ms = new Date(session.expiresAt).getTime() - Date.now()
    const timer = window.setTimeout(logout, Math.max(ms, 0))
    return () => window.clearTimeout(timer)
  }, [session, logout])

  const value = useMemo(
    () => ({ session, isCoordinator: session?.role === 'Coordinator', login, logout }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
