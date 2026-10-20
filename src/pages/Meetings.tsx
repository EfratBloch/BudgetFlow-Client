// Meetings: the list (cards along a flowing path), one meeting's page, and the report / edit form.
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import * as endpoints from '../api/endpoints'
import type { EquipmentDto, MeetingInput, MeetingType, ParticipantDto } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { ArtTile, Icon, TypeIcon } from '../components/Art'
import { CheckChip, ChipGroup, Select } from '../components/Controls'
import { useFeedback } from '../components/Feedback'
import { MeetingFlow, ParticipantBubbles } from '../components/Showcase'
import { EmptyState, ErrorBox, Field, Loader, Modal, PageHeader, Pager, Reveal } from '../components/ui'
import { colorFor, formatDate, formatMoney, initials, meetingTypeLabel, potLabel, toLocalInput, weekday } from '../utils/format'
import { errorText, useLoad } from '../utils/useLoad'

const PAGE_SIZE = 12

const guideTypes: MeetingType[] = ['Activity', 'Birthday']
const coordinatorTypes: MeetingType[] = ['GuidesMeeting', 'SpecialEvent']

// scope "mine": a guide's meetings, or the coordinator's own. scope "guides": the coordinator's
// view of every meeting the guides reported, with a filter by guide.
export function MeetingsList({ scope = 'mine' }: { scope?: 'mine' | 'guides' }) {
  const { session, isCoordinator } = useAuth()
  const guidesView = isCoordinator && scope === 'guides'
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') ?? 1)
  const type = (params.get('type') ?? '') as MeetingType | ''
  const pickedGuide = params.get('userId') ? Number(params.get('userId')) : undefined
  // The coordinator's own page is always her own meetings; the guides page filters by guide
  const userId = guidesView ? pickedGuide : isCoordinator ? session!.userId : undefined
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const sort = (params.get('sort') ?? 'date_desc') as 'date_desc' | 'date_asc'

  const guides = useLoad(() => (guidesView ? endpoints.getGuides(1, 100, 'name_asc') : Promise.resolve(null)), [guidesView])

  const { data, error, loading, reload } = useLoad(
    () =>
      endpoints.getMeetings({
        page,
        pageSize: PAGE_SIZE,
        type,
        userId,
        guidesOnly: guidesView || undefined,
        sort,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
      }),
    [page, type, userId, guidesView, from, to, sort],
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

  const hasFilter = type || pickedGuide || from || to
  const types = isCoordinator && !guidesView ? coordinatorTypes : guideTypes

  return (
    <div className="page theme-meetings">
      <PageHeader
        theme="meetings"
        eyebrow="מפגשים"
        title={guidesView ? 'מפגשי המדריכות' : 'המפגשים שלי'}
        subtitle={
          guidesView
            ? 'כל המפגשים שהמדריכות דיווחו. אפשר לסנן לפי מדריכה.'
            : 'כל כרטיס הוא מפגש, לפי סדר התאריכים. לחצי עליו כדי לראות את כל הפרטים.'
        }
        art={<ArtTile icon={guidesView ? 'list' : 'calendar'} size={72} />}
        actions={
          !guidesView && (
            <Link to="/meetings/new" className="btn btn-primary">
              <Icon name="plus" size={18} /> דיווח מפגש
            </Link>
          )
        }
      />

      <div className="filters card">
        <div className="filters-types">
          <ChipGroup<MeetingType | ''>
            ariaLabel="סוג המפגש"
            value={type}
            onChange={(v) => update({ type: v })}
            options={[
              { value: '', label: 'הכול', icon: <Icon name="layers" size={16} /> },
              ...types.map((t) => ({ value: t, label: meetingTypeLabel[t], icon: <TypeIcon type={t} size={20} /> })),
            ]}
          />
        </div>
        <div className="filters-row">
          {guidesView && (
            <Field label="מדריכה">
              <Select<number>
                value={pickedGuide ?? 0}
                onChange={(v) => update({ userId: v ? String(v) : '' })}
                icon={<Icon name="user" size={16} />}
                options={[{ value: 0, label: 'כל המדריכות' }, ...(guides.data?.items.map((g) => ({ value: g.id, label: g.fullName })) ?? [])]}
              />
            </Field>
          )}
          <Field label="מתאריך">
            <input type="date" value={from} onChange={(e) => update({ from: e.target.value })} />
          </Field>
          <Field label="עד תאריך">
            <input type="date" value={to} onChange={(e) => update({ to: e.target.value })} />
          </Field>
          <Field label="סדר" group>
            <ChipGroup<'date_desc' | 'date_asc'>
              ariaLabel="סדר"
              value={sort}
              onChange={(v) => update({ sort: v })}
              options={[
                { value: 'date_desc', label: 'החדש קודם', icon: <Icon name="sort" size={15} /> },
                { value: 'date_asc', label: 'הישן קודם', icon: <Icon name="sort" size={15} /> },
              ]}
            />
          </Field>
          {hasFilter && (
            <button className="btn btn-ghost btn-small filters-clear" onClick={() => setParams(new URLSearchParams())}>
              <Icon name="x" size={15} /> ניקוי סינון
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorBox message={error ?? ''} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <EmptyState
          art={<ArtTile icon="calendar" size={76} />}
          title={hasFilter ? 'אין מפגשים שמתאימים לסינון' : 'עוד אין מפגשים'}
          text={hasFilter ? 'נסי לשנות את הסינון.' : 'דווחי את המפגש הראשון, והוא יופיע כאן.'}
          action={
            !hasFilter &&
            !guidesView && (
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
          <MeetingFlow meetings={data.items} showReporter={guidesView} />
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
  const isBirthday = data.type === 'Birthday'
  // A guides meeting is attended by guides; every other meeting by participants
  const attendees =
    data.type === 'GuidesMeeting' ? data.guides.map((g) => ({ ...g, guideId: 0 })) : data.participants

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
        <Icon name="arrowRight" size={16} /> חזרה לכל המפגשים
      </Link>

      <div className={`meeting-hero type-${data.type}`}>
        <div className="meeting-hero-art">
          <TypeIcon type={data.type} size={104} />
        </div>
        <div className="meeting-hero-text">
          <span className={`type-chip type-chip-${data.type}`}>{meetingTypeLabel[data.type]}</span>
          <h1>{data.program}</h1>
          <p className="meeting-hero-date">
            <Icon name="calendar" size={16} /> {weekday(data.date)}, {formatDate(data.date)} · דיווחה {data.reporterName}
          </p>
        </div>
        {isOwner && (
          <div className="meeting-hero-actions">
            <Link to={`/meetings/${data.id}/edit`} className="btn btn-ghost">
              <Icon name="edit" size={16} /> עריכה
            </Link>
            <button className="btn btn-danger-ghost" onClick={remove}>
              <Icon name="trash" size={16} /> מחיקה
            </button>
          </div>
        )}
      </div>

      <div className="stats">
        {isBirthday ? (
          <div className="stat">
            <span className="stat-value">{data.participants[0]?.fullName ?? '—'}</span>
            <span className="stat-label">החניכה שחגגה</span>
          </div>
        ) : (
          <div className="stat">
            <span className="stat-value">{attendees.length}</span>
            <span className="stat-label">{data.type === 'GuidesMeeting' ? 'מדריכות' : 'משתתפות'}</span>
          </div>
        )}
        <div className="stat">
          <span className="stat-value">{formatMoney(data.totalExpenses)}</span>
          <span className="stat-label">סך ההוצאות</span>
        </div>
        {data.equipmentName ? (
          <div className="stat">
            <span className="stat-value">{data.equipmentName}</span>
            <span className="stat-label">פריט מהמחסן</span>
          </div>
        ) : (
          <div className="stat">
            <span className="stat-value">{data.expenses.length}</span>
            <span className="stat-label">פריטי הוצאה</span>
          </div>
        )}
      </div>

      {data.notes && !isBirthday && (
        <Reveal>
          <div className="card notes">
            <h3>
              <Icon name="note" size={20} /> מה עשינו
            </h3>
            <p>{data.notes}</p>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="card">
          <h3>
            <Icon name="coins" size={20} /> הוצאות
          </h3>
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

      {!isBirthday && (
        <Reveal>
          <div className="card">
            <h3>
              <Icon name="users" size={20} /> {data.type === 'GuidesMeeting' ? 'אילו מדריכות השתתפו' : 'מי השתתפה'}
            </h3>
            {attendees.length ? (
              <ParticipantBubbles participants={attendees} />
            ) : (
              <p className="muted">{data.type === 'GuidesMeeting' ? 'לא סומנו מדריכות.' : 'לא סומנו משתתפות.'}</p>
            )}
          </div>
        </Reveal>
      )}
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

  const types = isCoordinator ? coordinatorTypes : guideTypes
  const [type, setType] = useState<MeetingType>(types[0])
  const [date, setDate] = useState(toLocalInput(new Date()))
  const [program, setProgram] = useState('')
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [selectedGuides, setSelectedGuides] = useState<number[]>([])
  const [celebrant, setCelebrant] = useState<number | null>(null)
  const [equipmentId, setEquipmentId] = useState(0) // 0 = no item
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offer, setOffer] = useState<BirthdayOffer | null>(null)
  const [ready, setReady] = useState(editId === null)

  const isBirthday = type === 'Birthday'
  const isActivity = type === 'Activity'
  const isGuidesMeeting = type === 'GuidesMeeting'

  // The participants to choose from: a guide's own; the coordinator picks from every guide
  const people = useLoad<ParticipantDto[]>(async () => {
    if (!isCoordinator) return endpoints.getParticipants(session!.userId)
    const guides = await endpoints.getGuides(1, 100, 'name_asc')
    const lists = await Promise.all(guides.items.map((g) => endpoints.getParticipants(g.id)))
    return lists.flat()
  }, [isCoordinator, session?.userId])

  // A guides meeting is attended by guides, not participants
  const guideList = useLoad(() => (isCoordinator ? endpoints.getGuides(1, 100, 'name_asc') : Promise.resolve(null)), [isCoordinator])

  // Every item in the store - recording one on the meeting does not take it
  const store = useLoad<EquipmentDto[]>(() => (isCoordinator ? Promise.resolve([]) : endpoints.getEquipment()), [isCoordinator])

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
        setSelectedGuides(m.guides.map((g) => g.id))
        setCelebrant(m.type === 'Birthday' ? (m.participants[0]?.id ?? null) : null)
        setEquipmentId(m.equipmentId ?? 0)
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
    const celebrantName = people.data?.find((p) => p.id === celebrant)?.fullName
    if (isBirthday && (!celebrant || !celebrantName)) {
      setError('בחרי את החניכה שחוגגת.')
      return
    }

    setSaving(true)
    setError(null)
    const body: MeetingInput = {
      type,
      date: new Date(date).toISOString(),
      // A birthday has no topic of its own: it is named after the participant celebrating
      program: isBirthday ? `יום הולדת ל${celebrantName}` : program.trim(),
      notes: notes.trim() || undefined,
      equipmentId: isActivity && equipmentId ? equipmentId : null,
      participantIds: isBirthday ? [celebrant!] : isGuidesMeeting ? [] : selected,
      guideIds: isGuidesMeeting ? selectedGuides : [],
      expenses: expenses
        .filter((e) => e.description.trim() || e.amount)
        .map((e) => ({ description: e.description.trim(), amount: Number(e.amount) })),
      allowBirthdayDraw,
    }
    try {
      if (editId !== null) {
        await endpoints.updateMeeting(editId, body)
        toast('המפגש עודכן')
        navigate(`/meetings/${editId}`)
      } else {
        const created = await endpoints.createMeeting(body)
        toast(allowBirthdayDraw ? 'המפגש נשמר, וההפרש נלקח מקופת ימי ההולדת' : 'המפגש נשמר')
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
        eyebrow="מפגשים"
        title={editId ? 'עריכת מפגש' : 'דיווח מפגש חדש'}
        subtitle={editId ? 'סוג המפגש לא ניתן לשינוי, כי הוא קובע מאיזו קופה משלמים' : 'ממלאים, שומרים, והתקציב מתעדכן לבד'}
        art={<TypeIcon type={type} size={72} />}
      />

      <form onSubmit={submit} className="form card">
        <ChipGroup<MeetingType>
          ariaLabel="סוג המפגש"
          large
          full
          value={type}
          onChange={setType}
          disabled={editId !== null}
          options={types.map((t) => ({ value: t, label: meetingTypeLabel[t], icon: <TypeIcon type={t} size={40} /> }))}
        />

        <div className="form-row">
          <Field label="מתי היה המפגש?" hint="אי אפשר לדווח על מפגש עתידי">
            <input type="datetime-local" value={date} max={toLocalInput(new Date())} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          {!isBirthday && (
            <Field label={isActivity ? 'נושא הפעילות' : 'נושא המפגש'}>
              <input value={program} onChange={(e) => setProgram(e.target.value)} required minLength={2} maxLength={500} placeholder="למשל: משחק אמון בפארק" />
            </Field>
          )}
        </div>

        {!isBirthday && (
          <Field label="מה עשינו? (לא חובה)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3} placeholder="כמה מילים על מה שקרה במפגש" />
          </Field>
        )}

        {isActivity && (
          <Field label="פריט מהמחסן (לא חובה)" hint="רק לתיעוד: הפריט לא נלקח ולא משתנה במחסן">
            <Select<number>
              value={equipmentId}
              onChange={setEquipmentId}
              icon={<Icon name="box" size={16} />}
              options={[
                { value: 0, label: 'בלי פריט מהמחסן', icon: <Icon name="x" size={16} /> },
                ...(store.data ?? []).map((item) => ({ value: item.id, label: item.name, icon: <Icon name="box" size={16} />, hint: item.description ?? undefined })),
              ]}
            />
          </Field>
        )}

        {isBirthday ? (
          <div className="form-block">
            <div className="form-block-head">
              <h3>
                <Icon name="cake" size={20} /> החניכה שחוגגת
              </h3>
            </div>
            {people.loading ? (
              <Loader />
            ) : !people.data || people.data.length === 0 ? (
              <p className="muted">אין חניכות לבחור. אפשר להוסיף חניכות בדף "החניכות שלי".</p>
            ) : (
              <div className="attendance" role="radiogroup" aria-label="החניכה שחוגגת">
                {people.data.map((p) => (
                  <CheckChip
                    key={p.id}
                    radio
                    checked={celebrant === p.id}
                    onChange={() => setCelebrant(p.id)}
                    leading={
                      <span className="chip-avatar" style={{ background: colorFor(p.fullName) }}>
                        {initials(p.fullName)}
                      </span>
                    }
                  >
                    {p.fullName}
                  </CheckChip>
                ))}
              </div>
            )}
          </div>
        ) : isGuidesMeeting ? (
          <div className="form-block">
            <div className="form-block-head">
              <h3>
                <Icon name="users" size={20} /> אילו מדריכות הגיעו?
              </h3>
              {guideList.data && guideList.data.items.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() =>
                    setSelectedGuides(
                      selectedGuides.length === guideList.data!.items.length ? [] : guideList.data!.items.map((g) => g.id),
                    )
                  }
                >
                  {selectedGuides.length === guideList.data.items.length ? 'ניקוי הסימון' : 'סימון כולן'}
                </button>
              )}
            </div>
            {guideList.loading ? (
              <Loader />
            ) : !guideList.data || guideList.data.items.length === 0 ? (
              <p className="muted">אין מדריכות לסמן. אפשר להוסיף מדריכות בדף "מדריכות".</p>
            ) : (
              <div className="attendance">
                {guideList.data.items.map((g) => (
                  <CheckChip
                    key={g.id}
                    checked={selectedGuides.includes(g.id)}
                    onChange={() =>
                      setSelectedGuides((list) => (list.includes(g.id) ? list.filter((x) => x !== g.id) : [...list, g.id]))
                    }
                  >
                    {g.fullName}
                  </CheckChip>
                ))}
              </div>
            )}
            <span className="muted small">סומנו {selectedGuides.length}</span>
          </div>
        ) : (
          <div className="form-block">
            <div className="form-block-head">
              <h3>
                <Icon name="users" size={20} /> מי הגיעה?
              </h3>
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
                  <CheckChip key={p.id} checked={selected.includes(p.id)} onChange={() => toggle(p.id)}>
                    {p.fullName}
                  </CheckChip>
                ))}
              </div>
            )}
            <span className="muted small">סומנו {selected.length}</span>
          </div>
        )}

        <div className="form-block">
          <div className="form-block-head">
            <h3>
              <Icon name="coins" size={20} /> הוצאות
            </h3>
            <button type="button" className="btn btn-ghost btn-small" onClick={addExpense}>
              <Icon name="plus" size={15} /> הוצאה
            </button>
          </div>
          {expenses.length === 0 && <p className="muted">אין הוצאות? אפשר לשמור כך.</p>}
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
                <Icon name="x" size={16} />
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
            <div className="offer-art">
              <TypeIcon type="Birthday" size={64} />
            </div>
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
