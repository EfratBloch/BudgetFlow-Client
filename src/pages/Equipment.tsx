// The shared equipment store. Everyone takes and returns; the coordinator also manages the items.
import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import * as endpoints from '../api/endpoints'
import type { EquipmentDto, EquipmentStatus } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Projector } from '../components/Art'
import { useFeedback } from '../components/Feedback'
import { EmptyState, ErrorBox, Field, Loader, Modal, PageHeader } from '../components/ui'
import { equipmentStatusLabel, formatDateTime } from '../utils/format'
import { errorText, useLoad } from '../utils/useLoad'

export function Equipment() {
  const { session, isCoordinator } = useAuth()
  const { toast, confirm } = useFeedback()
  const [status, setStatus] = useState<EquipmentStatus | ''>('')
  const { data, error, loading, reload } = useLoad(() => endpoints.getEquipment(status), [status])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [editing, setEditing] = useState<EquipmentDto | 'new' | null>(null)

  const act = async (item: EquipmentDto, action: 'take' | 'return') => {
    setBusyId(item.id)
    try {
      if (action === 'take') {
        await endpoints.takeEquipment(item.id)
        toast(`${item.name} אצלך עכשיו 🎉`)
      } else {
        await endpoints.returnEquipment(item.id)
        toast(`${item.name} הוחזר למחסן`)
      }
    } catch (e) {
      // 409 on take = someone else was faster (or the item is not available any more)
      const text = e instanceof ApiError && e.status === 409 ? `${errorText(e)} 🏃‍♀️` : errorText(e)
      toast(text, 'error')
    } finally {
      setBusyId(null)
      void reload()
    }
  }

  const remove = async (item: EquipmentDto) => {
    const ok = await confirm({ title: 'למחוק את הפריט?', message: `${item.name} יימחק מהמחסן.`, confirmText: 'כן, למחוק', danger: true })
    if (!ok) return
    try {
      await endpoints.deleteEquipment(item.id)
      toast('הפריט נמחק')
      void reload()
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  return (
    <div className="page theme-equipment">
      <PageHeader
        theme="equipment"
        title="מחסן ציוד"
        subtitle="לוקחים בלחיצה ומחזירים בלחיצה. אם שתיים לוחצות יחד, רק אחת מקבלת."
        art={<Projector size={56} />}
        actions={
          isCoordinator && (
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              ＋ פריט חדש
            </button>
          )
        }
      />

      <div className="segmented">
        {(['', 'Available', 'Taken', 'Maintenance'] as const).map((s) => (
          <button key={s || 'all'} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>
            {s ? equipmentStatusLabel[s] : 'הכול'}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <ErrorBox message={error ?? ''} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState art={<Projector size={80} />} title="אין פריטים להצגה" text={isCoordinator ? 'הוסיפי את הפריט הראשון למחסן.' : undefined} />
      ) : (
        <div className="equipment-grid">
          {data.map((item, i) => {
            const mine = item.holderUserId === session?.userId
            return (
              <div key={item.id} className={`equipment-card status-${item.status}`} style={{ animationDelay: `${i * 70}ms` }}>
                <div className="equipment-art">
                  <Projector size={64} />
                  <span className={`status-pill pill-${item.status}`}>{equipmentStatusLabel[item.status]}</span>
                </div>
                <h3>{item.name}</h3>
                {item.description && <p className="muted small">{item.description}</p>}
                {item.status === 'Taken' && (
                  <p className="holder">
                    {mine ? 'אצלך' : `אצל ${item.holderName}`}
                    {item.takenAt && <span className="muted small"> · מאז {formatDateTime(item.takenAt)}</span>}
                  </p>
                )}
                <div className="equipment-actions">
                  {item.status === 'Available' && (
                    <button className="btn btn-primary btn-block" disabled={busyId === item.id} onClick={() => act(item, 'take')}>
                      {busyId === item.id ? '...' : 'לקחת'}
                    </button>
                  )}
                  {item.status === 'Taken' && (mine || isCoordinator) && (
                    <button className="btn btn-secondary btn-block" disabled={busyId === item.id} onClick={() => act(item, 'return')}>
                      {busyId === item.id ? '...' : 'להחזיר'}
                    </button>
                  )}
                  {isCoordinator && (
                    <div className="equipment-admin">
                      <button className="btn btn-ghost btn-small" onClick={() => setEditing(item)}>
                        ✏️ עריכה
                      </button>
                      <button className="btn btn-danger-ghost btn-small" onClick={() => remove(item)}>
                        🗑️ מחיקה
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <EquipmentEditor item={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={reload} />
      )}
    </div>
  )
}

function EquipmentEditor({ item, onClose, onSaved }: { item?: EquipmentDto; onClose: () => void; onSaved: () => void }) {
  const { toast } = useFeedback()
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [maintenance, setMaintenance] = useState(item?.status === 'Maintenance')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = { name: name.trim(), description: description.trim() || undefined }
      if (item) await endpoints.updateEquipment(item.id, { ...body, inMaintenance: maintenance })
      else await endpoints.createEquipment(body)
      toast(item ? 'הפריט עודכן' : 'הפריט נוסף למחסן')
      onSaved()
      onClose()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={item ? 'עריכת פריט' : 'פריט חדש'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Field label="שם הפריט">
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} autoFocus />
        </Field>
        <Field label="תיאור (לא חובה)">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} />
        </Field>
        {item && (
          <label className="check">
            <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} disabled={item.status === 'Taken'} />
            בתיקון (לא זמין להשאלה)
            {item.status === 'Taken' && <span className="muted small"> · אפשר אחרי שהפריט יוחזר</span>}
          </label>
        )}
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'שומרת...' : 'שמירה'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  )
}
