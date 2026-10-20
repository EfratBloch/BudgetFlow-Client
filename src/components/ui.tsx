// Small building blocks shared by the pages.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { BudgetPotDto } from '../api/types'
import { formatMoney, formulaInHebrew, potLabel } from '../utils/format'

// Fades and slides its content in the first time it scrolls into view
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  // Old browsers without IntersectionObserver just show everything
  const [visible, setVisible] = useState(() => !('IntersectionObserver' in window))

  useEffect(() => {
    const element = ref.current
    if (!element || visible) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export function Loader({ text = 'טוען...' }: { text?: string }) {
  return (
    <div className="loader" role="status">
      <span className="loader-dot" />
      <span className="loader-dot" />
      <span className="loader-dot" />
      <span className="loader-text">{text}</span>
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-box">
      <strong>אופס!</strong> {message}
      {onRetry && (
        <button className="btn btn-ghost btn-small" onClick={onRetry}>
          נסי שוב
        </button>
      )}
    </div>
  )
}

export function EmptyState({ art, title, text, action }: { art?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {art && <div className="empty-art">{art}</div>}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

// The coloured banner at the top of every page. Each page passes its own theme, so pages share
// the same shape but each has its own colour, background pattern and floating shapes.
export type PageTheme = 'home' | 'participants' | 'meetings' | 'equipment' | 'guides' | 'additions' | 'branch'

export function PageHeader({
  title,
  subtitle,
  art,
  actions,
  theme = 'home',
  stats,
}: {
  title: string
  subtitle?: string
  art?: ReactNode
  actions?: ReactNode
  theme?: PageTheme
  stats?: { label: string; value: ReactNode }[]
}) {
  return (
    <div className={`page-hero hero-${theme}`}>
      <span className="hero-shape s1" />
      <span className="hero-shape s2" />
      <span className="hero-shape s3" />
      <div className="page-hero-main">
        {art && <div className="page-hero-art">{art}</div>}
        <div className="page-hero-text">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {stats && stats.length > 0 && (
            <div className="hero-stats">
              {stats.map((s) => (
                <span key={s.label} className="hero-stat">
                  <strong>{s.value}</strong> {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="page-hero-actions">{actions}</div>}
    </div>
  )
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Rendered into <body>, so an animated page around it cannot shrink the full-screen backdrop
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="סגירה">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// One budget pot: amount left, a filling bar and the formula it came from
export function PotCard({ pot, delay = 0 }: { pot: BudgetPotDto; delay?: number }) {
  const used = pot.budget > 0 ? Math.min(100, Math.max(0, (pot.spent / pot.budget) * 100)) : 0
  const tone = used >= 90 ? 'pot-low' : used >= 65 ? 'pot-mid' : 'pot-ok'
  const [width, setWidth] = useState(0)

  // Start empty and grow, so the bar visibly fills when the page opens
  useEffect(() => {
    const timer = window.setTimeout(() => setWidth(used), 150 + delay)
    return () => window.clearTimeout(timer)
  }, [used, delay])

  return (
    <div className={`pot-card ${tone}`}>
      <div className="pot-title">{potLabel[pot.source]}</div>
      <div className="pot-remaining">{formatMoney(pot.remaining)}</div>
      <div className="pot-sub">נשארו מתוך {formatMoney(pot.budget)}</div>
      <div className="pot-bar" aria-label={`נוצלו ${Math.round(used)}%`}>
        <div className="pot-bar-fill" style={{ width: `${width}%` }} />
      </div>
      <div className="pot-foot">
        <span>נוצל {formatMoney(pot.spent)}</span>
        <span>{Math.round(used)}%</span>
      </div>
      <div className="pot-formula" title="איך חושב התקציב">
        {formulaInHebrew(pot.formula)}
      </div>
    </div>
  )
}

export function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="pager">
      <button className="btn btn-ghost btn-small" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        → הקודם
      </button>
      <span>
        עמוד {page} מתוך {totalPages}
      </span>
      <button className="btn btn-ghost btn-small" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        הבא ←
      </button>
    </div>
  )
}

// Text input with its label, used by every form
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
