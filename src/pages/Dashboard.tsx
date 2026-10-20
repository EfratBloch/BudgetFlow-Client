// The home page after login ("דף הבית"): a small strip of pots at the top and every meeting below it.
import { Link, useNavigate } from 'react-router-dom'
import * as endpoints from '../api/endpoints'
import type { BudgetPotDto, MeetingListItemDto, UserBudgetDto } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { ArtTile, Icon } from '../components/Art'
import { MeetingFlow } from '../components/Showcase'
import { EmptyState, ErrorBox, Loader, PageHeader, PotStrip, Reveal } from '../components/ui'
import { formatMoney } from '../utils/format'
import { useLoad } from '../utils/useLoad'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'בוקר טוב'
  if (hour < 17) return 'צהריים טובים'
  if (hour < 21) return 'ערב טוב'
  return 'לילה טוב'
}

// The caller's own meetings, newest first (the coordinator sees the guides' meetings on their own page).
// The API pages by at most 100, so the remaining pages are fetched together.
async function allMeetings(userId?: number): Promise<MeetingListItemDto[]> {
  const first = await endpoints.getMeetings({ page: 1, pageSize: 100, sort: 'date_desc', userId })
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      endpoints.getMeetings({ page: i + 2, pageSize: 100, sort: 'date_desc', userId }),
    ),
  )
  return [first, ...rest].flatMap((p) => p.items)
}

interface HomeData {
  pots: BudgetPotDto[]
  meetings: MeetingListItemDto[]
  guides: UserBudgetDto[]
}

export function Dashboard() {
  const { session, isCoordinator } = useAuth()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useLoad<HomeData>(async () => {
    const meetings = allMeetings(isCoordinator ? session!.userId : undefined)
    if (isCoordinator) {
      const summary = await endpoints.getBudgetSummary()
      return { pots: summary.coordinator.pots, guides: summary.guides, meetings: await meetings }
    }
    const budget = await endpoints.getMyBudget()
    return { pots: budget.pots, guides: [], meetings: await meetings }
  }, [isCoordinator, session?.userId])

  if (loading) return <Loader />
  if (error || !data) return <ErrorBox message={error ?? ''} onRetry={reload} />

  return (
    <div className="page theme-home">
      <PageHeader
        theme="home"
        eyebrow="דף הבית"
        title={`${greeting()}, ${session?.fullName.split(' ')[0]}`}
        subtitle={isCoordinator ? 'הקופות שלך, המפגשים שלך והמדריכות' : 'הקופות שלך וכל המפגשים שדיווחת'}
        art={<ArtTile icon="home" size={72} />}
        actions={
          <Link to="/meetings/new" className="btn btn-primary">
            <Icon name="plus" size={18} /> דיווח מפגש
          </Link>
        }
      />

      <PotStrip pots={data.pots} />

      <div className="quick-actions">
        {isCoordinator ? (
          <>
            <Link to="/guide-meetings" className="quick-action">
              <Icon name="list" size={17} /> מפגשי המדריכות
            </Link>
            <Link to="/guides" className="quick-action">
              <Icon name="user" size={17} /> מדריכות
            </Link>
            <Link to="/branch-participants" className="quick-action">
              <Icon name="users" size={17} /> כל החניכות
            </Link>
            <Link to="/additions" className="quick-action">
              <Icon name="coins" size={17} /> תוספת תקציב
            </Link>
          </>
        ) : (
          <Link to="/participants" className="quick-action">
            <Icon name="users" size={17} /> החניכות שלי
          </Link>
        )}
        <Link to="/equipment" className="quick-action">
          <Icon name="box" size={17} /> מחסן ציוד
        </Link>
      </div>

      <Reveal>
        <div className="section-head">
          <h2 className="section-title">
            <Icon name="calendar" size={22} /> {isCoordinator ? 'המפגשים שלי' : 'כל המפגשים'}
            <span className="section-count">{data.meetings.length}</span>
          </h2>
        </div>
        {data.meetings.length ? (
          <MeetingFlow meetings={data.meetings} />
        ) : (
          <EmptyState
            art={<ArtTile icon="calendar" size={76} />}
            title="עוד אין מפגשים"
            text="אחרי שתדווחי מפגש הוא יופיע כאן, לפי התאריך."
            action={
              <Link to="/meetings/new" className="btn btn-primary">
                דיווח מפגש ראשון
              </Link>
            }
          />
        )}
      </Reveal>

      {isCoordinator && (
        <Reveal>
          <h2 className="section-title">
            <Icon name="user" size={22} /> המדריכות והקופות שלהן
          </h2>
          {data.guides.length ? (
            <div className="guide-grid">
              {data.guides.map((guide, i) => (
                <button
                  key={guide.userId}
                  className="guide-tile"
                  style={{ animationDelay: `${i * 70}ms` }}
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
                  <span className="guide-tile-link">
                    לדף המדריכה <Icon name="arrowLeft" size={15} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              art={<ArtTile icon="user" size={72} />}
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
      )}
    </div>
  )
}
