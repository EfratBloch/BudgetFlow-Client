// The "interesting" views: participants as colourful tiles and meetings as cards
// in an even grid, grouped by month.
import { Link } from 'react-router-dom'
import type { MeetingListItemDto, ParticipantDto } from '../api/types'
import { colorFor, formatDate, formatMoney, initials, meetingTypeLabel, weekday } from '../utils/format'
import { Chairs, Icon, TypeIcon } from './Art'

export function ParticipantBubbles({
  participants,
  onSelect,
}: {
  participants: ParticipantDto[]
  onSelect?: (participant: ParticipantDto) => void
}) {
  return (
    <div className="bubbles">
      {participants.map((p, i) => {
        const color = colorFor(p.fullName)
        const content = (
          <>
            <span className="bubble-shape">{initials(p.fullName)}</span>
            <span className="bubble-text">
              <span className="bubble-name">{p.fullName}</span>
              <span className="bubble-phone" dir="ltr">
                {p.phone}
              </span>
            </span>
          </>
        )
        const style = { animationDelay: `${Math.min(i, 20) * 40}ms`, ['--bubble' as string]: color }
        return onSelect ? (
          <button key={p.id} type="button" className="bubble" style={style} onClick={() => onSelect(p)} title="לחצי לעריכה">
            {content}
          </button>
        ) : (
          <div key={p.id} className="bubble" style={style}>
            {content}
          </div>
        )
      })}
    </div>
  )
}

const typeColor: Record<string, string> = {
  Activity: '#EC4899',
  Birthday: '#EF4444',
  GuidesMeeting: '#0EA5E9',
  SpecialEvent: '#E11D48',
}

export function MeetingCard({ meeting: m, showReporter }: { meeting: MeetingListItemDto; showReporter: boolean }) {
  return (
    <Link to={`/meetings/${m.id}`} className={`meeting-card type-${m.type}`}>
      <span className="meeting-card-head">
        <span className="meeting-card-icon">
          <TypeIcon type={m.type} size={54} />
        </span>
        <span className="meeting-card-top">
          <span className={`type-chip type-chip-${m.type}`}>{meetingTypeLabel[m.type]}</span>
          <span className="meeting-date">
            {weekday(m.date)}, {formatDate(m.date)}
          </span>
        </span>
        <span className="meeting-card-chairs">
          <Chairs color={typeColor[m.type]} size={66} />
        </span>
      </span>
      <span className="meeting-title">{m.program}</span>
      {showReporter && <span className="muted small">דיווחה: {m.reporterName}</span>}
      <span className="meeting-meta">
        {m.type !== 'Birthday' && (
          <span>
            <Icon name="users" size={15} /> {m.participantCount} משתתפות
          </span>
        )}
        <span>
          <Icon name="coins" size={15} /> {formatMoney(m.totalExpenses)}
        </span>
        {m.equipmentName && (
          <span>
            <Icon name="box" size={15} /> {m.equipmentName}
          </span>
        )}
      </span>
    </Link>
  )
}

// Meetings grouped by month, as an even grid of cards
export function MeetingFlow({ meetings, showReporter = false }: { meetings: MeetingListItemDto[]; showReporter?: boolean }) {
  const groups: { key: string; title: string; items: MeetingListItemDto[] }[] = []
  for (const m of meetings) {
    const d = new Date(m.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = { key, title: d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }), items: [] }
      groups.push(group)
    }
    group.items.push(m)
  }

  return (
    <div className="meeting-months">
      {groups.map((g) => (
        <section key={g.key} className="meeting-month">
          <h3 className="month-title">
            <Icon name="calendar" size={17} />
            {g.title}
            <span className="flow-count">{g.items.length} מפגשים</span>
          </h3>
          <div className="meeting-grid">
            {g.items.map((m, i) => (
              <div key={m.id} className="meeting-grid-item" style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }}>
                <MeetingCard meeting={m} showReporter={showReporter} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
