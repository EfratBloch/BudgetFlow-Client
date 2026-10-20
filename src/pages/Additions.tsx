// Coordinator: add money to a guide's pot (new money or a transfer from her own pots), and cancel additions.
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as endpoints from '../api/endpoints'
import type { BudgetAdditionDto, BudgetAdditionKind, BudgetSource } from '../api/types'
import { ArtTile, Icon } from '../components/Art'
import { ChipGroup, Select } from '../components/Controls'
import { useFeedback } from '../components/Feedback'
import { EmptyState, ErrorBox, Field, Loader, PageHeader, PotCard } from '../components/ui'
import { formatDate, formatMoney, potIcon, potLabel } from '../utils/format'
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
      toast('התוספת נשמרה')
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
      <PageHeader theme="additions" title="תוספות תקציב" subtitle="הוספת כסף לקופה של מדריכה: כסף חדש, או העברה מהקופות שלך" eyebrow="תקציב" art={<ArtTile icon="coins" size={72} />} />

      {summary.data && (
        <div className="pots pots-compact">
          {summary.data.coordinator.pots.map((pot) => (
            <PotCard key={pot.source} pot={pot} />
          ))}
        </div>
      )}

      <div className="two-columns">
        <form className="card form" onSubmit={submit}>
          <h3>
            <Icon name="plus" size={20} /> תוספת חדשה
          </h3>
          <Field label="למי?">
            <Select<number>
              required
              placeholder="בחרי מדריכה"
              value={guideId}
              onChange={setGuideId}
              icon={<Icon name="user" size={16} />}
              options={guides.data?.items.map((g) => ({ value: g.id, label: g.fullName })) ?? []}
            />
          </Field>

          <ChipGroup<BudgetAdditionKind>
            ariaLabel="סוג התוספת"
            full
            value={kind}
            onChange={setKind}
            options={[
              { value: 'Extra', label: 'כסף חדש', icon: <Icon name="sparkle" size={17} /> },
              { value: 'Transfer', label: 'העברה מהקופות שלי', icon: <Icon name="transfer" size={17} /> },
            ]}
          />

          <Field label="לאיזו קופה שלה?" group>
            <ChipGroup<BudgetSource>
              ariaLabel="לאיזו קופה שלה"
              full
              value={targetPot}
              onChange={setTargetPot}
              options={[
                { value: 'Activity', label: potLabel.Activity, icon: <Icon name={potIcon.Activity} size={17} /> },
                { value: 'Birthday', label: potLabel.Birthday, icon: <Icon name={potIcon.Birthday} size={17} /> },
              ]}
            />
          </Field>
          {kind === 'Transfer' && (
            <Field label="מאיזו קופה שלי?" group>
              <ChipGroup<BudgetSource>
                ariaLabel="מאיזו קופה שלי"
                full
                value={fromPot}
                onChange={setFromPot}
                options={[
                  { value: 'Annual', label: potLabel.Annual, icon: <Icon name={potIcon.Annual} size={17} /> },
                  { value: 'GuideMeetings', label: potLabel.GuideMeetings, icon: <Icon name={potIcon.GuideMeetings} size={17} /> },
                ]}
              />
            </Field>
          )}

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
            <h3>
              <Icon name="list" size={20} /> תוספות שניתנו
            </h3>
            <Select<number>
              ariaLabel="סינון לפי מדריכה"
              className="select-inline"
              value={filterGuide ?? 0}
              onChange={(v) => setParams(v ? { guideId: String(v) } : {})}
              icon={<Icon name="user" size={16} />}
              options={[{ value: 0, label: 'כל המדריכות' }, ...(guides.data?.items.map((g) => ({ value: g.id, label: g.fullName })) ?? [])]}
            />
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
                  <span className={`addition-icon ${a.kind === 'Extra' ? 'extra' : 'transfer'}`}>
                    <Icon name={a.kind === 'Extra' ? 'sparkle' : 'transfer'} size={18} />
                  </span>
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
