// The app's own choice controls, so nothing looks like a plain browser control:
// a dropdown (Select), pill choices (ChipGroup), a check pill (CheckChip) and a switch.
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Art'

export interface Choice<T> {
  value: T
  label: string
  icon?: ReactNode
  hint?: string
}

// ---------- Select: a styled dropdown with keyboard support ----------

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'בחרי...',
  ariaLabel,
  required = false,
  disabled = false,
  icon,
  className = '',
}: {
  value: T | ''
  onChange: (value: T) => void
  options: Choice<T>[]
  placeholder?: string
  ariaLabel?: string
  required?: boolean
  disabled?: boolean
  icon?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [place, setPlace] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const id = useId()

  const selected = options.find((o) => o.value === value)

  // The menu is drawn in <body> (so a modal cannot clip it), right under the trigger
  useLayoutEffect(() => {
    if (!open) return
    const position = () => {
      const r = triggerRef.current?.getBoundingClientRect()
      if (!r) return
      const below = window.innerHeight - r.bottom
      const up = below < 260 && r.top > below
      setPlace({
        position: 'fixed',
        left: r.left,
        width: Math.max(r.width, 200),
        ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
        maxHeight: Math.min(320, (up ? r.top : below) - 16),
      })
    }
    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [open])

  // Click outside closes
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Keep the highlighted option in view (scrolls the menu only, never the page)
  useEffect(() => {
    const menu = menuRef.current
    const option = menu?.children[active] as HTMLElement | undefined
    if (!open || !menu || !option) return
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop
    else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight)
      menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight
  }, [open, active])

  const openMenu = () => {
    if (disabled) return
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  const choose = (choice: Choice<T>) => {
    onChange(choice.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (options[active]) choose(options[active])
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className={`select ${open ? 'select-open' : ''} ${disabled ? 'select-disabled' : ''} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKey}
      >
        {(selected?.icon ?? icon) && <span className="select-icon">{selected?.icon ?? icon}</span>}
        <span className={`select-value ${selected ? '' : 'select-placeholder'}`}>{selected ? selected.label : placeholder}</span>
        <Icon name="chevronDown" size={16} className="select-chevron" />
      </button>
      {/* Lets the browser's own "required" check stop the form */}
      {required && (
        <input className="select-proxy" tabIndex={-1} aria-hidden="true" required value={selected ? String(value) : ''} onChange={() => undefined} />
      )}
      {open &&
        createPortal(
          <ul ref={menuRef} id={id} role="listbox" className="select-menu" style={place}>
            {options.map((o, i) => (
              <li
                key={String(o.value)}
                role="option"
                aria-selected={o.value === value}
                className={`select-option ${i === active ? 'is-active' : ''} ${o.value === value ? 'is-selected' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
              >
                {o.icon && <span className="select-icon">{o.icon}</span>}
                <span className="select-option-text">
                  {o.label}
                  {o.hint && <span className="select-hint">{o.hint}</span>}
                </span>
                {o.value === value && <Icon name="check" size={16} className="select-check" />}
              </li>
            ))}
            {options.length === 0 && <li className="select-empty">אין אפשרויות</li>}
          </ul>,
          document.body,
        )}
    </div>
  )
}

// ---------- ChipGroup: pick one of a few, as rounded pills ----------

export function ChipGroup<T extends string | number>({
  value,
  onChange,
  options,
  disabled = false,
  full = false,
  large = false,
  ariaLabel,
}: {
  value: T
  onChange: (value: T) => void
  options: Choice<T>[]
  disabled?: boolean
  full?: boolean
  large?: boolean
  ariaLabel?: string
}) {
  return (
    <div className={`chips ${full ? 'chips-full' : ''} ${large ? 'chips-large' : ''}`} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            className={`chip ${on ? 'chip-on' : ''}`}
            disabled={disabled}
            onClick={() => onChange(o.value)}
          >
            {o.icon && <span className="chip-icon">{o.icon}</span>}
            <span className="chip-text">
              {o.label}
              {o.hint && <span className="chip-hint">{o.hint}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ---------- CheckChip: a pill that is on or off ----------

export function CheckChip({
  checked,
  onChange,
  children,
  radio = false,
  leading,
}: {
  checked: boolean
  onChange: () => void
  children: ReactNode
  radio?: boolean
  leading?: ReactNode
}) {
  return (
    <button
      type="button"
      role={radio ? 'radio' : 'checkbox'}
      aria-checked={checked}
      className={`check-chip ${checked ? 'on' : ''} ${radio ? 'check-chip-radio' : ''}`}
      onClick={onChange}
    >
      <span className="check-mark">{checked && <Icon name="check" size={13} strokeWidth={3} />}</span>
      {leading}
      <span className="check-chip-text">{children}</span>
    </button>
  )
}

// ---------- Switch: an on/off toggle with a label ----------

export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
  disabled?: boolean
}) {
  return (
    <div className={`switch-row ${disabled ? 'is-disabled' : ''}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch ${checked ? 'on' : ''}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-knob" />
      </button>
      <span>
        {label}
        {hint && <span className="muted small d-block">{hint}</span>}
      </span>
    </div>
  )
}
