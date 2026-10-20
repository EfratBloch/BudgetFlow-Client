// Toast messages and the "are you sure?" dialog, available from any page through useFeedback().
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  text: string
}

interface ConfirmRequest {
  title: string
  message: string
  confirmText?: string
  danger?: boolean
}

interface FeedbackState {
  toast: (text: string, kind?: ToastKind) => void
  confirm: (request: ConfirmRequest) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackState | null>(null)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pending, setPending] = useState<ConfirmRequest | null>(null)
  const resolver = useRef<((answer: boolean) => void) | null>(null)
  const nextId = useRef(1)

  const toast = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = nextId.current++
    setToasts((list) => [...list, { id, kind, text }])
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4500)
  }, [])

  const confirm = useCallback((request: ConfirmRequest) => {
    setPending(request)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const answer = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setPending(null)
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span className="toast-icon">{t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i'}</span>
            {t.text}
          </div>
        ))}
      </div>

      {pending && (
        <div className="modal-backdrop" onClick={() => answer(false)}>
          <div className="modal modal-small" role="alertdialog" onClick={(e) => e.stopPropagation()}>
            <h3>{pending.title}</h3>
            <p>{pending.message}</p>
            <div className="modal-actions">
              <button className={pending.danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={() => answer(true)} autoFocus>
                {pending.confirmText ?? 'כן'}
              </button>
              <button className="btn btn-ghost" onClick={() => answer(false)}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback(): FeedbackState {
  const context = useContext(FeedbackContext)
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider')
  return context
}
