// Forms that open in a modal: a participant and a guide.
import { useState, type FormEvent } from 'react'
import * as endpoints from '../api/endpoints'
import type { ParticipantDto, UserDto } from '../api/types'
import { errorText } from '../utils/useLoad'
import { useFeedback } from './Feedback'
import { Field, Modal } from './ui'

export function ParticipantEditor({
  guideId,
  participant,
  onClose,
  onSaved,
}: {
  guideId: number
  participant?: ParticipantDto
  onClose: () => void
  onSaved: () => void
}) {
  const { toast, confirm } = useFeedback()
  const [fullName, setFullName] = useState(participant?.fullName ?? '')
  const [nationalId, setNationalId] = useState(participant?.nationalId ?? '')
  const [phone, setPhone] = useState(participant?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = { fullName: fullName.trim(), nationalId: nationalId.trim(), phone: phone.trim() }
      if (participant) await endpoints.updateParticipant(participant.id, body)
      else await endpoints.createParticipant(guideId, body)
      toast(participant ? 'פרטי החניכה עודכנו' : 'החניכה נוספה לקבוצה 🎉')
      onSaved()
      onClose()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!participant) return
    const ok = await confirm({
      title: 'למחוק את החניכה?',
      message: `${participant.fullName} תימחק מהקבוצה, וגם רישומי הנוכחות שלה.`,
      confirmText: 'כן, למחוק',
      danger: true,
    })
    if (!ok) return
    try {
      await endpoints.deleteParticipant(participant.id)
      toast('החניכה נמחקה')
      onSaved()
      onClose()
    } catch (err) {
      toast(errorText(err), 'error')
    }
  }

  return (
    <Modal title={participant ? 'עריכת חניכה' : 'חניכה חדשה'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label="שם מלא">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={100} autoFocus />
        </Field>
        <Field label="תעודת זהות" hint="9 ספרות">
          <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} required pattern="\d{9}" inputMode="numeric" dir="ltr" />
        </Field>
        <Field label="טלפון">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} inputMode="tel" dir="ltr" />
        </Field>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'שומרת...' : participant ? 'שמירת שינויים' : 'הוספה'}
          </button>
          {participant && (
            <button type="button" className="btn btn-danger-ghost" onClick={remove}>
              מחיקה
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function GuideEditor({ guide, onClose, onSaved }: { guide?: UserDto; onClose: () => void; onSaved: () => void }) {
  const { toast } = useFeedback()
  const [fullName, setFullName] = useState(guide?.fullName ?? '')
  const [email, setEmail] = useState(guide?.email ?? '')
  const [phone, setPhone] = useState(guide?.phone ?? '')
  const [nationalId, setNationalId] = useState(guide?.nationalId ?? '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = { fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), nationalId: nationalId.trim() }
      if (guide) await endpoints.updateGuide(guide.id, body)
      else await endpoints.createGuide({ ...body, initialPassword: password })
      toast(guide ? 'פרטי המדריכה עודכנו' : 'המדריכה נוספה 🎉')
      onSaved()
      onClose()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={guide ? 'עריכת מדריכה' : 'מדריכה חדשה'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label="שם מלא">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} autoFocus />
        </Field>
        <Field label="אימייל (משמש להתחברות)">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
        </Field>
        <div className="form-row">
          <Field label="טלפון">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" dir="ltr" />
          </Field>
          <Field label="תעודת זהות" hint="9 ספרות">
            <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} required pattern="\d{9}" inputMode="numeric" dir="ltr" />
          </Field>
        </div>
        {!guide && (
          <Field label="סיסמה ראשונית" hint="לפחות 8 תווים. מסרי אותה למדריכה.">
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} dir="ltr" />
          </Field>
        )}
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'שומרת...' : guide ? 'שמירת שינויים' : 'הוספת מדריכה'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  )
}
