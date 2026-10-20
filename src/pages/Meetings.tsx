// Meetings: the list (as calendar cards), one meeting's page, and the report / edit form.
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import * as endpoints from '../api/endpoints'
import type { MeetingInput, MeetingType, ParticipantDto } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Chair } from '../components/Art'
import { useFeedback } from '../components/Feedback'
import { MeetingTimeline, ParticipantBubbles } from '../components/Showcase'
import { EmptyState, ErrorBox, Field, Loader, Modal, PageHeader, Pager, Reveal } from '../components/ui'
import {
  formatDate,
  formatMoney,
  meetingTypeEmoji,
  meetingTypeLabel,
  potLabel,
  toLocalInput,
  weekday,
} from '../utils/format'
import { errorText, useLoad } from '../utils/useLoad'

const PAGE_SIZE = 12

export function MeetingsList() {
  const { isCoordinator } = useAuth()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') ?? 1)
  const type = (params.get('type') ?? '') as MeetingType | ''
  const userId = params.get('userId') ? Number(params.get('userId')) : undefined
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const sort = (params.get('sort') ?? 'date_desc') as 'date_desc' | 'date_asc'

  const guides = useLoad(() => (isCoordinator ? endpoints.getGuides(1, 100, 'name_asc') : Promise.resolve(null)), [isCoordinator])

  const { data, error, loading, reload } = useLoad(
    () =>
      endpoints.getMeetings({
        page,
        pageSize: PAGE_SIZE,
        type,
        userId,
        sort,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
      }),
    [page, type, userId, from, to, sort],
  )

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  const hasFilter = type || userId || from || to

  return (
    <div className="page theme-meetings">
      <PageHeader
        theme="meetings"
        title={isCoordinator ? 'כל המפגשים' : 'המפגשים שלי'}
        subtitle="כל כרטיס הוא מפגש. לחצי עליו כדי לראות את כל הפרטים."
        art={<Chair size={56} />}
        actions={
          <Link to="/meetings/new" className="btn btn-primary">
            ＋ דיווח מפגש
          </Link>
        }
      />

      <div className="filters">
        <Field label="סוג">
          <select value={type} onChange={(e) => update({ type: e.target.value })}>
            <option value="">הכול</option>
            {(isCoordinator ? ['Activity', 'Birthday', 'GuidesMeeting', 'SpecialEvent'] : ['Activity', 'Birthday']).map((t) => (
              <option key={t} value={t}>
                {meetingTypeLabel[t as MeetingType]}
              </option>
            ))}
          </select>
        </Field>
        {isCoordinator && (
          <Field label="מי דיווחה">
            <select value={userId ?? ''} onChange={(e) => update({ userId: e.target.value })}>
              <option value="">כולן</option>
              {guides.data?.items.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.fullName}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="מתאריך">
          <input type="date" value={from} onChange={(e) => update({ from: e.target.value })} />
        </Field>
        <Field label="עד תאריך">
          <input type="date" value={to} onChange={(e) => update({ to: e.target.value })} />
        </Field>
        <Field label="סדר">
          <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
            <option value="date_desc">החדש ביותר קודם</option>
            <option value="date_asc">הישן ביותר קודם</option>
          </select>
        </Field>
        {hasFilter && (
          <button className="btn btn-ghost btn-small filters-clear" onClick={() => setParams(new URLSearchParams())}>
            ניקוי סינון
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorBox message={error ?? ''} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <EmptyState
          art={<Chair size={80} />}
          title={hasFilter ? 'אין מפגשים שמתאימים לסינון' : 'עוד אין מפגשים'}
          text={hasFilter ? 'נסי לשנות את הסינון.' : 'דווחי את המפגש הראשון, והוא יופיע כאן.'}
          action={
            !hasFilter && (
              <Link to="/meetings/new" className="btn btn-primary">
                דיווח מפגש
              </Link>
            )
          }
        />
      ) : (
        <>
          <p className="muted">
            {data.totalCount} מפגשים{data.totalPages > 1 ? `, מוצגים ${data.items.length} בעמוד` : ''}
          </p>
          <MeetingTimeline meetings={data.items} showReporter={isCoordinator} />
          <Pager page={page} totalPages={data.totalPages} onPage={(p) => update({ page: String(p) })} />
        </>
      )}
    </div>
  )
}

export function MeetingDetails() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const { data, error, loading, reload } = useLoad(() => endpoints.getMeeting(Number(id)), [id])

  if (loading) return <Loader />
  if (error || !data) return <ErrorBox message={error ?? ''} onRetry={reload} />

  const isOwner = data.userId === session?.userId

  const remove = async () => {
    const ok = await confirm({
      title: 'למחוק את המפגש?',
      message: 'המפגש, ההוצאות והנוכחות שלו יימחקו, והכסף יחזור לקופה.',
      confirmText: 'כן, למחוק',
      danger: true,
    })
    if (!ok) return
    try {
      await endpoints.deleteMeeting(data.id)
      toast('המפגש נמחק')
      navigate('/meetings')
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  return (
    <div className="page theme-meetings">
      <Link to="/meetings" className="back-link">
        → חזרה לכל המפגשים
      </Link>

      <div className={`meeting-hero type-${data.type}`}>
        <div className="meeting-hero-art">
          <Chair size={110} />
        </div>
        <div>
          <span className="type-chip">
            {meetingTypeEmoji[data.type]} {meetingTypeLabel[data.type]}
          </span>
          <h1>{data.program}</h1>
          <p className="meeting-hero-date">
            {weekday(data.date)}, {formatDate(data.date)} · דיווחה {data.reporterName}
          </p>
        </div>
        {isOwner && (
          <div className="meeting-hero-actions">
            <Link to={`/meetings/${data.id}/edit`} className="btn btn-light">
              ✏️ עריכה
            </Link>
            <button className="btn btn-danger-ghost btn-on-dark" onClick={remove}>
              🗑️ מחיקה
            </button>
          </div>
        )}
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{data.participants.length}</span>
          <span className="stat-label">משתתפות</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatMoney(data.totalExpenses)}</span>
          <span className="stat-label">סך ההוצאות</span>
        </div>
        <div className="stat">
          <span className="stat-value">{data.expenses.length}</span>
          <span className="stat-label">פריטי הוצאה</span>
        </div>
      </div>

      {data.notes && (
        <Reveal>
          <div className="card notes">
            <h3>📝 הערות</h3>
            <p>{data.notes}</p>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="card">
          <h3>💰 הוצאות</h3>
          {data.expenses.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>תיאור</th>
                  <th>קופה</th>
                  <th>סכום</th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.description}</td>
                    <td>
                      <span className={`pot-chip pot-chip-${e.budgetSource}`}>{potLabel[e.budgetSource]}</span>
                    </td>
                    <td>{formatMoney(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>סה"כ</td>
                  <td>{formatMoney(data.totalExpenses)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="muted">במפגש הזה לא היו הוצאות.</p>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className="card">
          <h3>👥 מי השתתפה</h3>
          {data.participants.length ? (
            <ParticipantBubbles participants={data.participants} />
          ) : (
            <p className="muted">לא סומנו משתתפות.</p>
          )}
        </div>
      </Reveal>
    </div>
  )
}

interface ExpenseRow {
  key: number
  description: string
  amount: string
}

interface BirthdayOffer {
  shortfall: number
  birthdayAvailable: number
}

export function MeetingForm() {
  const { id } = useParams()
  const editId = id ? Number(id) : null
  const { session, isCoordinator } = useAuth()
  const navigate = useNavigate()
  const { toast } = useFeedback()

  const types: MeetingType[] = isCoordinator ? ['GuidesMeeting', 'SpecialEvent'] : ['Activity', 'Birthday']
  const [type, setType] = useState<MeetingType>(types[0])
  const [date, setDate] = useState(toLocalInput(new Date()))
  const [program, setProgram] = useState('')
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offer, setOffer] = useState<BirthdayOffer | null>(null)
  const [ready, setReady] = useState(editId === null)

  // The participants to choose from: a guide's own; the coordinator picks from every guide
  const people = useLoad<ParticipantDto[]>(async () => {
    if (!isCoordinator) return endpoints.getParticipants(session!.userId)
    const guides = await endpoints.getGuides(1, 100, 'name_asc')
    const lists = await Promise.all(guides.items.map((g) => endpoints.getParticipants(g.id)))
    return lists.flat()
  }, [isCoordinator, session?.userId])

  // When editing, fill the form with the saved meeting
  useEffect(() => {
    if (editId === null) return
    endpoints
      .getMeeting(editId)
      .then((m) => {
        setType(m.type)
        setDate(toLocalInput(new Date(m.date)))
        setProgram(m.program)
        setNotes(m.notes ?? '')
        setSelected(m.participants.map((p) => p.id))
        setExpenses(m.expenses.map((e, i) => ({ key: i + 1, description: e.description, amount: String(e.amount) })))
        setReady(true)
      })
      .catch((e) => setError(errorText(e)))
  }, [editId])

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  const toggle = (pid: number) => setSelected((list) => (list.includes(pid) ? list.filter((x) => x !== pid) : [...list, pid]))

  const addExpense = () => setExpenses((list) => [...list, { key: Date.now(), description: '', amount: '' }])
  const changeExpense = (key: number, field: 'description' | 'amount', value: string) =>
    setExpenses((list) => list.map((e) => (e.key === key ? { ...e, [field]: value } : e)))
  const removeExpense = (key: number) => setExpenses((list) => list.filter((e) => e.key !== key))

  const save = async (allowBirthdayDraw: boolean) => {
    setSaving(true)
    setError(null)
    const body: MeetingInput = {
      type,
      date: new Date(date).toISOString(),
      program: program.trim(),
      notes: notes.trim() || undefined,
      participantIds: selected,
      expenses: expenses
        .filter((e) => e.description.trim() || e.amount)
        .map((e) => ({ description: e.description.trim(), amount: Number(e.amount) })),
      allowBirthdayDraw,
    }
    try {
      if (editId !== null) {
        await endpoints.updateMeeting(editId, body)
        toast('המפגש עודכן ✓')
        navigate(`/meetings/${editId}`)
      } else {
        const created = await endpoints.createMeeting(body)
        toast(allowBirthdayDraw ? 'המפגש נשמר, וההפרש נלקח מקופת ימי ההולדת 🎂' : 'המפגש נשמר! 🎉')
        navigate(`/meetings/${created.id}`)
      }
    } catch (e) {
      // Over the activity pot, but the birthday pot can cover it: ask the guide
      if (e instanceof ApiError && e.status === 409 && typeof e.details.birthdayAvailable === 'number') {
        setOffer({ shortfall: Number(e.details.shortfall), birthdayAvailable: Number(e.details.birthdayAvailable) })
      } else {
        const extra =
          e instanceof ApiError && typeof e.details.shortfall === 'number'
            ? ` (חסרים ${formatMoney(Number(e.details.shortfall))})`
            : ''
        setError(errorText(e) + extra)
      }
    } finally {
      setSaving(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void save(false)
  }

  if (!ready) return error ? <ErrorBox message={error} /> : <Loader />

  return (
    <div className="page page-narrow theme-meetings">
      <PageHeader
        theme="meetings"
        title={editId ? 'עריכת מפגש' : 'דיווח מפגש חדש'}
        subtitle={editId ? 'סוג המפגש לא ניתן לשינוי, כי הוא קובע מאיזו קופה משלמים' : 'ממלאים, שומרים, והתקציב מתעדכן לבד'}
        art={<Chair size={56} />}
      />

      <form onSubmit={submit} className="form card">
        <div className="type-picker">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className={`type-option ${type === t ? 'selected' : ''}`}
              onClick={() => setType(t)}
              disabled={editId !== null}
            >
              <span className="type-emoji">{meetingTypeEmoji[t]}</span>
              {meetingTypeLabel[t]}
            </button>
          ))}
        </div>

        <div className="form-row">
          <Field label="מתי היה המפגש?" hint="אי אפשר לדווח על מפגש עתידי">
            <input type="datetime-local" value={date} max={toLocalInput(new Date())} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="מה עשינו? (תוכנית המפגש)">
            <input value={program} onChange={(e) => setProgram(e.target.value)} required minLength={2} maxLength={500} placeholder="למשל: משחק אמון בפארק" />
          </Field>
        </div>

        <Field label="הערות (לא חובה)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} />
        </Field>

        <div className="form-block">
          <div className="form-block-head">
            <h3>👥 מי הגיעה?</h3>
            {people.data && people.data.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => setSelected(selected.length === people.data!.length ? [] : people.data!.map((p) => p.id))}
              >
                {selected.length === people.data.length ? 'ניקוי הסימון' : 'סימון כולן'}
              </button>
            )}
          </div>
          {people.loading ? (
            <Loader />
          ) : !people.data || people.data.length === 0 ? (
            <p className="muted">אין חניכות לסמן. אפשר להוסיף חניכות בדף "החניכות שלי".</p>
          ) : (
            <div className="attendance">
              {people.data.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`attend-chip ${selected.includes(p.id) ? 'on' : ''}`}
                  onClick={() => toggle(p.id)}
                >
                  <span className="attend-check">{selected.includes(p.id) ? '✓' : ''}</span>
                  {p.fullName}
                </button>
              ))}
            </div>
          )}
          <span className="muted small">סומנו {selected.length}</span>
        </div>

        <div className="form-block">
          <div className="form-block-head">
            <h3>💰 הוצאות</h3>
            <button type="button" className="btn btn-ghost btn-small" onClick={addExpense}>
              ＋ הוצאה
            </button>
          </div>
          {expenses.length === 0 && <p className="muted">אין הוצאות? מעולה. אפשר לשמור כך.</p>}
          {expenses.map((e) => (
            <div key={e.key} className="expense-row">
              <input placeholder="על מה?" value={e.description} onChange={(ev) => changeExpense(e.key, 'description', ev.target.value)} required minLength={2} />
              <input
                type="number"
                placeholder="₪"
                min="0.01"
                step="0.01"
                value={e.amount}
                onChange={(ev) => changeExpense(e.key, 'amount', ev.target.value)}
                required
              />
              <button type="button" className="icon-btn" onClick={() => removeExpense(e.key)} aria-label="הסרת ההוצאה">
                ✕
              </button>
            </div>
          ))}
          {expenses.length > 0 && <div className="expense-total">סה"כ: {formatMoney(total)}</div>}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button className="btn btn-primary btn-large" disabled={saving}>
            {saving ? 'שומרת...' : editId ? 'שמירת השינויים' : 'שמירת המפגש'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            ביטול
          </button>
        </div>
      </form>

      {offer && (
        <Modal title="אין מספיק בקופת הפעילות" onClose={() => setOffer(null)}>
          <div className="offer">
            <div className="offer-art">🎂</div>
            <p>
              חסרים <strong>{formatMoney(offer.shortfall)}</strong> בקופת הפעילות.
              <br />
              בקופת ימי ההולדת יש <strong>{formatMoney(offer.birthdayAvailable)}</strong>.
            </p>
            <p className="muted">
              אם תאשרי, מה שנשאר בקופת הפעילות ינוצל קודם, ורק ההפרש של {formatMoney(offer.shortfall)} יילקח מקופת ימי ההולדת.
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setOffer(null)
                void save(true)
              }}
            >
              כן, להשלים מקופת ימי ההולדת
            </button>
            <button className="btn btn-ghost" onClick={() => setOffer(null)}>
              לא, אחזור לתקן
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
