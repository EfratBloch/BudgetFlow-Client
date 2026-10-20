// The "interesting" views: participants as colourful bubbles and meetings as calendar cards.
import { Link } from 'react-router-dom'
import type { MeetingListItemDto, ParticipantDto } from '../api/types'
import { colorFor, dayOfMonth, formatMoney, initials, meetingTypeEmoji, meetingTypeLabel, monthShort, weekday } from '../utils/format'
import { Chair } from './Art'

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
            <span className="bubble-shape" style={{ background: color }}>
              {initials(p.fullName)}
            </span>
            <span className="bubble-name">{p.fullName}</span>
            <span className="bubble-phone">{p.phone}</span>
          </>
        )
        return onSelect ? (
          <button
            key={p.id}
            type="button"
            className="bubble"
            style={{ animationDelay: `${i * 60}ms`, ['--bubble' as string]: color }}
            onClick={() => onSelect(p)}
            title="לחצי לעריכה"
          >
            {content}
          </button>
        ) : (
          <div key={p.id} className="bubble" style={{ animationDelay: `${i * 60}ms`, ['--bubble' as string]: color }}>
            {content}
          </div>
        )
      })}
    </div>
  )
}

const chairColor: Record<string, string> = {
  Activity: '#0E9F9A',
  Birthday: '#E0A526',
  GuidesMeeting: '#3A86C8',
  SpecialEvent: '#7C6CD6',
}

// The meetings page: the same cards, hung on a timeline and grouped by month
export function MeetingTimeline({ meetings, showReporter = false }: { meetings: MeetingListItemDto[]; showReporter?: boolean }) {
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
    <div className="timeline">
      {groups.map((g) => (
        <section key={g.key} className="timeline-month">
          <h3 className="timeline-title">
            <span className="timeline-dot" />
            {g.title}
            <span className="timeline-count">{g.items.length} מפגשים</span>
          </h3>
          <MeetingCards meetings={g.items} showReporter={showReporter} />
        </section>
      ))}
    </div>
  )
}

export function MeetingCards({ meetings, showReporter = false }: { meetings: MeetingListItemDto[]; showReporter?: boolean }) {
  return (
    <div className="meeting-cards">
      {meetings.map((m, i) => (
        <Link
          key={m.id}
          to={`/meetings/${m.id}`}
          className={`meeting-card type-${m.type}`}
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="calendar-leaf">
            <span className="leaf-month">{monthShort(m.date)}</span>
            <span className="leaf-day">{dayOfMonth(m.date)}</span>
            <span className="leaf-weekday">{weekday(m.date)}</span>
          </div>
          <div className="meeting-card-body">
            <span className="type-chip">
              {meetingTypeEmoji[m.type]} {meetingTypeLabel[m.type]}
            </span>
            <h4>{m.program}</h4>
            {showReporter && <div className="muted small">דיווחה: {m.reporterName}</div>}
            <div className="meeting-meta">
              <span>👥 {m.participantCount} משתתפות</span>
              <span>💰 {formatMoney(m.totalExpenses)}</span>
            </div>
          </div>
          <div className="meeting-card-art">
            <Chair size={54} color={chairColor[m.type]} />
          </div>
        </Link>
      ))}
    </div>
  )
}
