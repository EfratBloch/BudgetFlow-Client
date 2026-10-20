// The first page after login: the guide's own panel, or the coordinator's overview.
import { Link, useNavigate } from 'react-router-dom'
import * as endpoints from '../api/endpoints'
import { useAuth } from '../auth/AuthContext'
import { Chair, Group, Projector, Wallet } from '../components/Art'
import { MeetingCards, ParticipantBubbles } from '../components/Showcase'
import { EmptyState, ErrorBox, Loader, PageHeader, PotCard, Reveal } from '../components/ui'
import { formatMoney } from '../utils/format'
import { useLoad } from '../utils/useLoad'

export function Dashboard() {
  const { isCoordinator } = useAuth()
  return isCoordinator ? <CoordinatorDashboard /> : <GuideDashboard />
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'בוקר טוב'
  if (hour < 17) return 'צהריים טובים'
  if (hour < 21) return 'ערב טוב'
  return 'לילה טוב'
}

function GuideDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useLoad(() => endpoints.getOverview('me'), [])

  if (loading) return <Loader />
  if (error || !data) return <ErrorBox message={error ?? ''} onRetry={reload} />

  const meetings = data.recentMeetings.items

  return (
    <div className="page theme-home">
      <PageHeader
        theme="home"
        title={`${greeting()}, ${session?.fullName.split(' ')[0]} 👋`}
        subtitle="זה מה שקורה אצלך בקבוצה"
        art={<Chair size={56} />}
      />

      <div className="quick-actions">
        <Link to="/meetings/new" className="quick-action qa-main">
          <span className="qa-icon">＋</span>דיווח מפגש
        </Link>
        <Link to="/participants" className="quick-action">
          <span className="qa-icon">👥</span>החניכות שלי
        </Link>
        <Link to="/equipment" className="quick-action">
          <span className="qa-icon">📽️</span>לקחת ציוד
        </Link>
      </div>

      <Reveal>
        <h2 className="section-title">
          <Wallet size={32} /> הקופות שלי
        </h2>
        <div className="pots">
          {data.pots.map((pot, i) => (
            <PotCard key={pot.source} pot={pot} delay={i * 150} />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="section-head">
          <h2 className="section-title">
            <Chair size={32} /> המפגשים האחרונים
          </h2>
          {data.recentMeetings.totalCount > 0 && (
            <Link to="/meetings" className="btn btn-ghost btn-small">
              לכל {data.recentMeetings.totalCount} המפגשים ←
            </Link>
          )}
        </div>
        {meetings.length ? (
          <MeetingCards meetings={meetings} />
        ) : (
          <EmptyState
            art={<Chair size={72} />}
            title="עוד לא דיווחת על מפגש"
            text="אחרי המפגש הראשון הוא יופיע כאן, עם התאריך וההוצאות."
            action={
              <Link to="/meetings/new" className="btn btn-primary">
                דיווח מפגש ראשון
              </Link>
            }
          />
        )}
      </Reveal>

      <Reveal>
        <div className="section-head">
          <h2 className="section-title">
            <Group size={32} /> החניכות שלי ({data.participants.length})
          </h2>
          <Link to="/participants" className="btn btn-ghost btn-small">
            ניהול החניכות ←
          </Link>
        </div>
        {data.participants.length ? (
          <ParticipantBubbles participants={data.participants} onSelect={() => navigate('/participants')} />
        ) : (
          <EmptyState art={<Group size={72} />} title="עוד אין חניכות בקבוצה" text="הוסיפי את החניכה הראשונה שלך." />
        )}
      </Reveal>
    </div>
  )
}

function CoordinatorDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useLoad(() => endpoints.getBudgetSummary(), [])

  if (loading) return <Loader />
  if (error || !data) return <ErrorBox message={error ?? ''} onRetry={reload} />

  return (
    <div className="page theme-home">
      <PageHeader
        theme="home"
        title={`${greeting()}, ${session?.fullName.split(' ')[0]} 👋`}
        subtitle="תמונת מצב של הסניף"
        art={<Wallet size={56} />}
      />

      <div className="quick-actions">
        <Link to="/guides" className="quick-action qa-main">
          <span className="qa-icon">＋</span>ניהול מדריכות
        </Link>
        <Link to="/branch-participants" className="quick-action">
          <span className="qa-icon">👥</span>כל החניכות בסניף
        </Link>
        <Link to="/meetings/new" className="quick-action">
          <span className="qa-icon">🤝</span>דיווח מפגש מדריכות
        </Link>
        <Link to="/additions" className="quick-action">
          <span className="qa-icon">💰</span>תוספת תקציב
        </Link>
        <Link to="/equipment" className="quick-action">
          <span className="qa-icon">📽️</span>מחסן ציוד
        </Link>
      </div>

      <Reveal>
        <h2 className="section-title">
          <Wallet size={32} /> הקופות שלי
        </h2>
        <div className="pots">
          {data.coordinator.pots.map((pot, i) => (
            <PotCard key={pot.source} pot={pot} delay={i * 150} />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="section-title">
          <Group size={32} /> המדריכות והקופות שלהן
        </h2>
        {data.guides.length ? (
          <div className="guide-grid">
            {data.guides.map((guide, i) => (
              <button
                key={guide.userId}
                className="guide-tile"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => navigate(`/guides/${guide.userId}`)}
              >
                <div className="guide-tile-head">
                  <span className="avatar avatar-large">{guide.fullName.slice(0, 1)}</span>
                  <strong>{guide.fullName}</strong>
                </div>
                {guide.pots.map((pot) => {
                  const used = pot.budget > 0 ? Math.min(100, (pot.spent / pot.budget) * 100) : 0
                  return (
                    <div key={pot.source} className="mini-pot">
                      <div className="mini-pot-row">
                        <span>{pot.source === 'Activity' ? 'פעילות' : 'ימי הולדת'}</span>
                        <span>{formatMoney(pot.remaining)} נשארו</span>
                      </div>
                      <div className="pot-bar pot-bar-thin">
                        <div className="pot-bar-fill" style={{ width: `${used}%` }} />
                      </div>
                    </div>
                  )
                })}
                <span className="guide-tile-link">לדף המדריכה ←</span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            art={<Projector size={72} />}
            title="עוד אין מדריכות"
            text="הוסיפי מדריכה ראשונה כדי להתחיל."
            action={
              <Link to="/guides" className="btn btn-primary">
                הוספת מדריכה
              </Link>
            }
          />
        )}
      </Reveal>
    </div>
  )
}
