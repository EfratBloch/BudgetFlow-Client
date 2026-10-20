// Login and the one-time coordinator registration.
import { useState, type FocusEvent, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import * as endpoints from '../api/endpoints'
import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Art'
import { useFeedback } from '../components/Feedback'
import { Field } from '../components/ui'
import { errorText } from '../utils/useLoad'

// Fields open read-only and unlock on focus, so the browser never fills in a previous user's details
const unlock = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.removeAttribute('readonly')
const fresh = { readOnly: true, onFocus: unlock, autoComplete: 'off' } as const

export function Login() {
  const { session, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) return <Navigate to="/dashboard" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/dashboard', { replace: true })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} autoComplete="off">
        <div className="auth-logo">
          <Logo size={64} />
        </div>
        <h1>שמחות לראות אותך!</h1>
        <p className="muted">התחברי עם האימייל והסיסמה שלך</p>
        <Field label="אימייל">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" {...fresh} />
        </Field>
        <Field label="סיסמה">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" {...fresh} autoComplete="new-password" />
        </Field>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'מתחברת...' : 'כניסה'}
        </button>
        <p className="auth-foot">
          עוד אין רכזת במערכת? <Link to="/register">רישום רכזת</Link>
        </p>
      </form>
    </div>
  )
}

export function Register() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { toast } = useFeedback()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) return <Navigate to="/dashboard" replace />

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await endpoints.registerCoordinator({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      })
      toast('נרשמת בהצלחה! עכשיו אפשר להתחבר')
      navigate('/login')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} autoComplete="off">
        <div className="auth-logo">
          <Logo size={64} />
        </div>
        <h1>רישום רכזת</h1>
        <p className="muted">במערכת יש רכזת אחת. אחרי הרישום תוכלי להוסיף את המדריכות.</p>
        <Field label="שם מלא">
          <input value={form.fullName} onChange={set('fullName')} required minLength={2} {...fresh} />
        </Field>
        <Field label="אימייל">
          <input type="email" value={form.email} onChange={set('email')} required dir="ltr" {...fresh} />
        </Field>
        <Field label="טלפון">
          <input value={form.phone} onChange={set('phone')} required inputMode="tel" dir="ltr" {...fresh} />
        </Field>
        <Field label="סיסמה" hint="לפחות 8 תווים">
          <input type="password" value={form.password} onChange={set('password')} required minLength={8} dir="ltr" {...fresh} autoComplete="new-password" />
        </Field>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'נרשמת...' : 'רישום'}
        </button>
        <p className="auth-foot">
          כבר רשומה? <Link to="/login">כניסה</Link>
        </p>
      </form>
    </div>
  )
}
