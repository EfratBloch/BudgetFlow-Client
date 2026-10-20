// The guide's participants, as bubbles. Clicking a bubble opens it for editing.
import { useState } from 'react'
import * as endpoints from '../api/endpoints'
import type { ParticipantDto } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { ArtTile, Icon } from '../components/Art'
import { ParticipantEditor } from '../components/Editors'
import { ParticipantBubbles } from '../components/Showcase'
import { EmptyState, ErrorBox, Loader, PageHeader } from '../components/ui'
import { useLoad } from '../utils/useLoad'

export function ParticipantsSection({ guideId }: { guideId: number }) {
  const { data, error, loading, reload } = useLoad(() => endpoints.getParticipants(guideId), [guideId])
  const [editing, setEditing] = useState<ParticipantDto | 'new' | null>(null)
  const [search, setSearch] = useState('')

  if (loading) return <Loader />
  if (error || !data) return <ErrorBox message={error ?? ''} onRetry={reload} />

  const term = search.trim()
  const shown = term ? data.filter((p) => p.fullName.includes(term) || p.phone.includes(term)) : data

  return (
    <>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={18} /> הוספת חניכה
        </button>
        {data.length > 0 && (
          <span className="search">
            <Icon name="search" size={17} />
            <input placeholder="חיפוש לפי שם או טלפון" value={search} onChange={(e) => setSearch(e.target.value)} />
          </span>
        )}
        <span className="muted">{data.length} חניכות בקבוצה</span>
      </div>

      {data.length === 0 ? (
        <EmptyState
          art={<ArtTile icon="users" size={76} />}
          title="עוד אין חניכות בקבוצה"
          text="הוסיפי את החניכה הראשונה. אחר כך אפשר לסמן אותה בכל מפגש."
          action={
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              הוספת חניכה ראשונה
            </button>
          }
        />
      ) : shown.length === 0 ? (
        <p className="muted center">לא נמצאה חניכה בשם הזה.</p>
      ) : (
        <ParticipantBubbles participants={shown} onSelect={(p) => setEditing(p)} />
      )}

      {editing && (
        <ParticipantEditor
          guideId={guideId}
          participant={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </>
  )
}

export function Participants() {
  const { session } = useAuth()
  return (
    <div className="page theme-participants">
      <PageHeader theme="participants" title="החניכות שלי" subtitle="לחצי על חניכה כדי לערוך או למחוק אותה" eyebrow="הקבוצה שלי" art={<ArtTile icon="users" size={72} />} />
      <ParticipantsSection guideId={session!.userId} />
    </div>
  )
}
