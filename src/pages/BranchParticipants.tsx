// Coordinator: every participant in the branch, grouped by guide, with search and a guide filter.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as endpoints from '../api/endpoints'
import type { ParticipantDto, UserDto } from '../api/types'
import { Group } from '../components/Art'
import { ParticipantEditor } from '../components/Editors'
import { ParticipantBubbles } from '../components/Showcase'
import { EmptyState, ErrorBox, Loader, PageHeader, Reveal } from '../components/ui'
import { useLoad } from '../utils/useLoad'

interface GuideGroup {
  guide: UserDto
  participants: ParticipantDto[]
}

export function BranchParticipants() {
  const { data, error, loading, reload } = useLoad<GuideGroup[]>(async () => {
    const guides = await endpoints.getGuides(1, 100, 'name_asc')
    const lists = await Promise.all(guides.items.map((g) => endpoints.getParticipants(g.id)))
    return guides.items.map((guide, i) => ({ guide, participants: lists[i] }))
  }, [])

  const [search, setSearch] = useState('')
  const [guideFilter, setGuideFilter] = useState<number | ''>('')
  const [editing, setEditing] = useState<{ guideId: number; participant?: ParticipantDto } | null>(null)

  if (loading) return <Loader />
  if (error || !data) return <ErrorBox message={error ?? ''} onRetry={reload} />

  const total = data.reduce((sum, g) => sum + g.participants.length, 0)
  const term = search.trim()
  const shown = data
    .filter((g) => guideFilter === '' || g.guide.id === guideFilter)
    .map((g) => ({
      ...g,
      participants: term ? g.participants.filter((p) => p.fullName.includes(term) || p.phone.includes(term)) : g.participants,
    }))
    .filter((g) => !term || g.participants.length > 0)

  return (
    <div className="page theme-branch">
      <PageHeader
        theme="branch"
        title="כל החניכות בסניף"
        subtitle="כל החניכות של כל המדריכות, במקום אחד. לחצי על חניכה כדי לערוך אותה."
        art={<Group size={56} />}
        stats={[
          { label: 'חניכות', value: total },
          { label: 'מדריכות', value: data.length },
        ]}
      />

      {data.length === 0 ? (
        <EmptyState
          art={<Group size={80} />}
          title="עוד אין מדריכות בסניף"
          text="קודם מוסיפים מדריכות, ואז הן (או את) מוסיפות להן חניכות."
          action={
            <Link to="/guides" className="btn btn-primary">
              הוספת מדריכה
            </Link>
          }
        />
      ) : (
        <>
          <div className="toolbar">
            <input className="search" placeholder="🔍 חיפוש חניכה לפי שם או טלפון" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select
              className="toolbar-select"
              value={guideFilter}
              onChange={(e) => setGuideFilter(e.target.value ? Number(e.target.value) : '')}
              aria-label="סינון לפי מדריכה"
            >
              <option value="">כל המדריכות</option>
              {data.map((g) => (
                <option key={g.guide.id} value={g.guide.id}>
                  {g.guide.fullName} ({g.participants.length})
                </option>
              ))}
            </select>
          </div>

          {shown.length === 0 && <p className="muted center">לא נמצאה חניכה בשם הזה.</p>}

          {shown.map((g, i) => (
            <Reveal key={g.guide.id} delay={i * 80}>
              <section className="guide-group">
                <div className="guide-group-head">
                  <span className="avatar avatar-large">{g.guide.fullName.slice(0, 1)}</span>
                  <div>
                    <h2>הקבוצה של {g.guide.fullName}</h2>
                    <span className="muted small">{g.participants.length} חניכות</span>
                  </div>
                  <div className="guide-group-actions">
                    <button className="btn btn-ghost btn-small" onClick={() => setEditing({ guideId: g.guide.id })}>
                      ＋ חניכה לקבוצה
                    </button>
                    <Link to={`/guides/${g.guide.id}`} className="btn btn-ghost btn-small">
                      לדף המדריכה ←
                    </Link>
                  </div>
                </div>
                {g.participants.length ? (
                  <ParticipantBubbles participants={g.participants} onSelect={(p) => setEditing({ guideId: g.guide.id, participant: p })} />
                ) : (
                  <p className="muted">אין עדיין חניכות בקבוצה הזו.</p>
                )}
              </section>
            </Reveal>
          ))}
        </>
      )}

      {editing && (
        <ParticipantEditor
          guideId={editing.guideId}
          participant={editing.participant}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  )
}
