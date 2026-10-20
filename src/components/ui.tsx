// Small building blocks shared by the pages.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { BudgetPotDto } from '../api/types'
import { formatMoney, formulaInHebrew, potIcon, potLabel } from '../utils/format'
import { HeroPattern, Icon } from './Art'

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
      { threshold: 0.08 },
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
      <span className="loader-ring" />
      <span className="loader-text">{text}</span>
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-box">
      <Icon name="alert" size={20} />
      <span>{message}</span>
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

// The title area at the top of every page. Each page passes its own theme: the same glass
// panel everywhere, but with the page's own accent colour and line pattern.
export type PageTheme = 'home' | 'participants' | 'meetings' | 'equipment' | 'guides' | 'additions' | 'branch'

export function PageHeader({
  title,
  subtitle,
  art,
  actions,
  theme = 'home',
  eyebrow,
  stats,
}: {
  title: string
  subtitle?: string
  art?: ReactNode
  actions?: ReactNode
  theme?: PageTheme
  eyebrow?: string
  stats?: { label: string; value: ReactNode }[]
}) {
  return (
    <div className={`page-hero hero-${theme}`}>
      <span className="hero-glow" />
      <HeroPattern theme={theme} />
      <div className="page-hero-main">
        {art && <div className="page-hero-art">{art}</div>}
        <div className="page-hero-text">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
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
            <Icon name="x" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

const usedPercent = (pot: BudgetPotDto) => (pot.budget > 0 ? Math.min(100, Math.max(0, (pot.spent / pot.budget) * 100)) : 0)
const toneFor = (used: number) => (used >= 90 ? 'pot-low' : used >= 65 ? 'pot-mid' : 'pot-ok')

// Start empty and grow, so a bar visibly fills when the page opens
function useGrow(target: number, delay: number) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const timer = window.setTimeout(() => setWidth(target), 150 + delay)
    return () => window.clearTimeout(timer)
  }, [target, delay])
  return width
}

// One budget pot: amount left, a filling bar and the formula it came from
export function PotCard({ pot, delay = 0 }: { pot: BudgetPotDto; delay?: number }) {
  const used = usedPercent(pot)
  const width = useGrow(used, delay)

  return (
    <div className={`pot-card pot-${pot.source} ${toneFor(used)}`}>
      <div className="pot-title">
        <span className="pot-icon">
          <Icon name={potIcon[pot.source]} size={18} />
        </span>
        {potLabel[pot.source]}
      </div>
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

// The home page's small strip of pots: one compact chip per pot
export function PotStrip({ pots }: { pots: BudgetPotDto[] }) {
  return (
    <div className="pot-strip">
      {pots.map((pot, i) => (
        <PotChip key={pot.source} pot={pot} delay={i * 120} />
      ))}
    </div>
  )
}

function PotChip({ pot, delay }: { pot: BudgetPotDto; delay: number }) {
  const used = usedPercent(pot)
  const width = useGrow(used, delay)
  return (
    <div className={`pot-chip-card pot-${pot.source} ${toneFor(used)}`} title={formulaInHebrew(pot.formula)}>
      <div className="pot-chip-row">
        <span className="pot-icon">
          <Icon name={potIcon[pot.source]} size={16} />
        </span>
        <span className="pot-chip-text">
          <span className="pot-chip-label">{potLabel[pot.source]}</span>
          <strong>
            {formatMoney(pot.remaining)} <span className="pot-chip-of">נשארו</span>
          </strong>
        </span>
        <span className="pot-chip-percent">{Math.round(used)}%</span>
      </div>
      <div className="pot-bar pot-bar-strip" aria-label={`נוצלו ${Math.round(used)}%`}>
        <div className="pot-bar-fill" style={{ width: `${width}%` }} />
      </div>
      <div className="pot-chip-foot">
        נוצלו {formatMoney(pot.spent)} מתוך {formatMoney(pot.budget)}
      </div>
    </div>
  )
}

export function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="pager">
      <button className="btn btn-ghost btn-small" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <Icon name="arrowRight" size={16} /> הקודם
      </button>
      <span>
        עמוד {page} מתוך {totalPages}
      </span>
      <button className="btn btn-ghost btn-small" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        הבא <Icon name="arrowLeft" size={16} />
      </button>
    </div>
  )
}

// An input with its label, used by every form. group: a set of pill choices, which must not
// sit inside a <label> (clicking the label text would press the first pill).
export function Field({ label, hint, group = false, children }: { label: string; hint?: string; group?: boolean; children: ReactNode }) {
  const Tag = group ? 'div' : 'label'
  return (
    <Tag className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </Tag>
  )
}
