// Coordinator: the guides list (add / edit / delete) and one guide's page.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import * as endpoints from '../api/endpoints'
import type { UserDto } from '../api/types'
import { ArtTile, Icon } from '../components/Art'
import { Select } from '../components/Controls'
import { GuideEditor } from '../components/Editors'
import { useFeedback } from '../components/Feedback'
import { MeetingFlow } from '../components/Showcase'
import { EmptyState, ErrorBox, Loader, PageHeader, Pager, PotCard, Reveal } from '../components/ui'
import { formatDate } from '../utils/format'
import { errorText, useLoad } from '../utils/useLoad'
import { ParticipantsSection } from './Participants'

export function Guides() {
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('name_asc')
  const { data, error, loading, reload } = useLoad(() => endpoints.getGuides(page, 12, sort), [page, sort])
  const [editing, setEditing] = useState<UserDto | 'new' | null>(null)

  const remove = async (guide: UserDto) => {
    const ok = await confirm({
      title: `למחוק את ${guide.fullName}?`,
      message: 'המדריכה לא תוכל להתחבר יותר. אי אפשר לבטל את הפעולה.',
      confirmText: 'כן, למחוק',
      danger: true,
    })
    if (!ok) return
    try {
      await endpoints.deleteGuide(guide.id)
      toast(`${guide.fullName} נמחקה`)
      void reload()
    } catch (e) {
      // 409: she still has participants, meetings, an item or budget additions
      const text =
        e instanceof ApiError && e.status === 409
          ? `אי אפשר למחוק את ${guide.fullName} כרגע: יש לה עדיין חניכות, מפגשים, ציוד או תוספות תקציב. קודם צריך לטפל בהם.`
          : errorText(e)
      toast(text, 'error')
    }
  }

  return (
    <div className="page theme-guides">
      <PageHeader
        theme="guides"
        title="המדריכות"
        subtitle="הוספה, עריכה ומחיקה של מדריכות. לחצי על מדריכה כדי לראות את כל מה ששלה."
        eyebrow="צוות"
        art={<ArtTile icon="user" size={72} />}
        actions={
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={18} /> מדריכה חדשה
          </button>
        }
      />

      <div className="toolbar">
        <Select<string>
          ariaLabel="מיון"
          className="select-inline"
          value={sort}
          icon={<Icon name="sort" size={16} />}
          onChange={(v) => {
            setSort(v)
            setPage(1)
          }}
          options={[
            { value: 'name_asc', label: 'שם (א-ת)' },
            { value: 'name_desc', label: 'שם (ת-א)' },
            { value: 'created_desc', label: 'הצטרפה לאחרונה' },
            { value: 'created_asc', label: 'הצטרפה ראשונה' },
          ]}
        />
        {data && <span className="muted">{data.totalCount} מדריכות</span>}
      </div>

      {loading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorBox message={error ?? ''} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <EmptyState
          art={<ArtTile icon="user" size={76} />}
          title="עוד אין מדריכות"
          text="הוסיפי את המדריכה הראשונה, והיא תוכל להתחבר עם האימייל והסיסמה שתבחרי."
          action={
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              הוספת מדריכה
            </button>
          }
        />
      ) : (
        <>
          <div className="people-grid">
            {data.items.map((g, i) => (
              <div key={g.id} className="person-card" style={{ animationDelay: `${i * 70}ms` }}>
                <button className="person-main" onClick={() => navigate(`/guides/${g.id}`)}>
                  <span className="avatar avatar-large">{g.fullName.slice(0, 1)}</span>
                  <span>
                    <strong>{g.fullName}</strong>
                    <span className="muted small d-block" dir="ltr">
                      {g.email}
                    </span>
                    <span className="muted small d-block" dir="ltr">
                      {g.phone}
                    </span>
                  </span>
                </button>
                <div className="person-actions">
                  <button className="btn btn-ghost btn-small" onClick={() => navigate(`/guides/${g.id}`)}>
                    <Icon name="eye" size={15} /> לדף שלה
                  </button>
                  <button className="btn btn-ghost btn-small" onClick={() => setEditing(g)}>
                    <Icon name="edit" size={15} /> עריכה
                  </button>
                  <button className="btn btn-danger-ghost btn-small" onClick={() => remove(g)}>
                    <Icon name="trash" size={15} /> מחיקה
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pager page={page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}

      {editing && <GuideEditor guide={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  )
}

export function GuidePage() {
  const { id } = useParams()
  const guideId = Number(id)
  const { data, error, loading, reload } = useLoad(() => endpoints.getOverview(guideId), [guideId])
  const [editing, setEditing] = useState(false)

  if (loading) return <Loader />
  if (error || !data) return <ErrorBox message={error ?? ''} onRetry={reload} />

  const { guide, pots, recentMeetings } = data

  return (
    <div className="page theme-guides">
      <Link to="/guides" className="back-link">
        <Icon name="arrowRight" size={16} /> חזרה לכל המדריכות
      </Link>

      <div className="profile-hero">
        <span className="avatar avatar-xl">{guide.fullName.slice(0, 1)}</span>
        <div>
          <h1>{guide.fullName}</h1>
          <p className="muted">
            <span dir="ltr">{guide.email}</span> · <span dir="ltr">{guide.phone}</span> · הצטרפה ב-{formatDate(guide.createdAt)}
          </p>
        </div>
        <div className="profile-actions">
          <button className="btn btn-ghost" onClick={() => setEditing(true)}>
            <Icon name="edit" size={16} /> עריכת פרטים
          </button>
          <Link to={`/additions?guideId=${guide.id}`} className="btn btn-primary">
            <Icon name="coins" size={16} /> תוספת תקציב
          </Link>
        </div>
      </div>

      <Reveal>
        <h2 className="section-title">
          <Icon name="wallet" size={22} /> הקופות שלה
        </h2>
        <div className="pots">
          {pots.map((pot, i) => (
            <PotCard key={pot.source} pot={pot} delay={i * 150} />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="section-head">
          <h2 className="section-title">
            <Icon name="calendar" size={22} /> המפגשים שלה
          </h2>
          {recentMeetings.totalCount > recentMeetings.items.length && (
            <Link to={`/meetings?userId=${guide.id}`} className="btn btn-ghost btn-small">
              לכל {recentMeetings.totalCount} המפגשים <Icon name="arrowLeft" size={15} />
            </Link>
          )}
        </div>
        {recentMeetings.items.length ? (
          <MeetingFlow meetings={recentMeetings.items} />
        ) : (
          <EmptyState art={<ArtTile icon="calendar" size={64} />} title="עוד לא דווחו מפגשים" />
        )}
      </Reveal>

      <Reveal>
        <h2 className="section-title">
          <Icon name="users" size={22} /> החניכות שלה
        </h2>
        <ParticipantsSection guideId={guide.id} />
      </Reveal>

      {editing && <GuideEditor guide={guide} onClose={() => setEditing(false)} onSaved={reload} />}
    </div>
  )
}
