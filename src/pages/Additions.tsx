// Coordinator: add money to a guide's pot (new money or a transfer from her own pots), and cancel additions.
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as endpoints from '../api/endpoints'
import type { BudgetAdditionDto, BudgetAdditionKind, BudgetSource } from '../api/types'
import { Wallet } from '../components/Art'
import { useFeedback } from '../components/Feedback'
import { EmptyState, ErrorBox, Field, Loader, PageHeader, PotCard } from '../components/ui'
import { formatDate, formatMoney, potLabel } from '../utils/format'
import { errorText, useLoad } from '../utils/useLoad'

export function Additions() {
  const { toast, confirm } = useFeedback()
  const [params, setParams] = useSearchParams()
  const filterGuide = params.get('guideId') ? Number(params.get('guideId')) : undefined

  const guides = useLoad(() => endpoints.getGuides(1, 100, 'name_asc'), [])
  const summary = useLoad(() => endpoints.getBudgetSummary(), [])
  const list = useLoad(() => endpoints.getBudgetAdditions(filterGuide), [filterGuide])

  const [guideId, setGuideId] = useState<number | ''>(filterGuide ?? '')
  const [kind, setKind] = useState<BudgetAdditionKind>('Extra')
  const [targetPot, setTargetPot] = useState<BudgetSource>('Activity')
  const [fromPot, setFromPot] = useState<BudgetSource>('Annual')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    void list.reload()
    void summary.reload()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (guideId === '') return
    setSaving(true)
    setError(null)
    try {
      await endpoints.createBudgetAddition(guideId, {
        kind,
        targetPot,
        amount: Number(amount),
        reason: reason.trim(),
        fromPot: kind === 'Transfer' ? fromPot : undefined,
      })
      toast('התוספת נשמרה 💰')
      setAmount('')
      setReason('')
      refresh()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const cancel = async (a: BudgetAdditionDto) => {
    const ok = await confirm({
      title: 'לבטל את התוספת?',
      message: `${formatMoney(a.amount)} יורדים מ${potLabel[a.targetPot]} של ${a.guideName}.`,
      confirmText: 'כן, לבטל',
      danger: true,
    })
    if (!ok) return
    try {
      await endpoints.deleteBudgetAddition(a.id)
      toast('התוספת בוטלה')
      refresh()
    } catch (err) {
      toast(errorText(err), 'error')
    }
  }

  return (
    <div className="page theme-additions">
      <PageHeader theme="additions" title="תוספות תקציב" subtitle="הוספת כסף לקופה של מדריכה: כסף חדש, או העברה מהקופות שלך" art={<Wallet size={56} />} />

      {summary.data && (
        <div className="pots pots-compact">
          {summary.data.coordinator.pots.map((pot) => (
            <PotCard key={pot.source} pot={pot} />
          ))}
        </div>
      )}

      <div className="two-columns">
        <form className="card form" onSubmit={submit}>
          <h3>➕ תוספת חדשה</h3>
          <Field label="למי?">
            <select value={guideId} onChange={(e) => setGuideId(e.target.value ? Number(e.target.value) : '')} required>
              <option value="">בחרי מדריכה</option>
              {guides.data?.items.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.fullName}
                </option>
              ))}
            </select>
          </Field>

          <div className="segmented segmented-full">
            <button type="button" className={kind === 'Extra' ? 'active' : ''} onClick={() => setKind('Extra')}>
              ✨ כסף חדש
            </button>
            <button type="button" className={kind === 'Transfer' ? 'active' : ''} onClick={() => setKind('Transfer')}>
              🔁 העברה מהקופות שלי
            </button>
          </div>

          <div className="form-row">
            <Field label="לאיזו קופה שלה?">
              <select value={targetPot} onChange={(e) => setTargetPot(e.target.value as BudgetSource)}>
                <option value="Activity">{potLabel.Activity}</option>
                <option value="Birthday">{potLabel.Birthday}</option>
              </select>
            </Field>
            {kind === 'Transfer' && (
              <Field label="מאיזו קופה שלי?">
                <select value={fromPot} onChange={(e) => setFromPot(e.target.value as BudgetSource)}>
                  <option value="Annual">{potLabel.Annual}</option>
                  <option value="GuideMeetings">{potLabel.GuideMeetings}</option>
                </select>
              </Field>
            )}
          </div>

          <div className="form-row">
            <Field label="סכום (₪)">
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>
            <Field label="סיבה">
              <input value={reason} onChange={(e) => setReason(e.target.value)} required minLength={2} maxLength={200} placeholder="למשל: טיול שנתי" />
            </Field>
          </div>

          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'שומרת...' : 'הוספת התוספת'}
          </button>
        </form>

        <div className="card">
          <div className="form-block-head">
            <h3>📜 תוספות שניתנו</h3>
            <select
              value={filterGuide ?? ''}
              onChange={(e) => setParams(e.target.value ? { guideId: e.target.value } : {})}
              aria-label="סינון לפי מדריכה"
            >
              <option value="">כל המדריכות</option>
              {guides.data?.items.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.fullName}
                </option>
              ))}
            </select>
          </div>
          {list.loading ? (
            <Loader />
          ) : list.error || !list.data ? (
            <ErrorBox message={list.error ?? ''} onRetry={list.reload} />
          ) : list.data.length === 0 ? (
            <EmptyState title="עוד לא ניתנו תוספות" />
          ) : (
            <ul className="additions">
              {list.data.map((a) => (
                <li key={a.id} className="addition">
                  <span className={`addition-icon ${a.kind === 'Extra' ? 'extra' : 'transfer'}`}>{a.kind === 'Extra' ? '✨' : '🔁'}</span>
                  <div className="addition-text">
                    <strong>
                      {formatMoney(a.amount)} ל{potLabel[a.targetPot]} של {a.guideName}
                    </strong>
                    <span className="muted small">
                      {a.reason} · {formatDate(a.createdAt)}
                      {a.fromPot && ` · מ${potLabel[a.fromPot]}`}
                    </span>
                  </div>
                  <button className="btn btn-danger-ghost btn-small" onClick={() => cancel(a)}>
                    ביטול
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
