import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ArtTile, FlowOrbit } from '../components/Art'
import { Reveal } from '../components/ui'

const features = [
  {
    art: <ArtTile icon="wallet" size={60} />,
    title: 'תקציב שמתעדכן לבד',
    text: 'כל קופה מחושבת מהתעריפים ומההוצאות. רואים מיד כמה נשאר, ואף פגישה לא חורגת בלי אישור.',
  },
  {
    art: <ArtTile icon="calendar" size={60} />,
    title: 'מפגשים וחניכות',
    text: 'מדווחים מפגש בכמה לחיצות: מי הגיעה, מה עשינו וכמה הוצאנו. הכול נשמר ומסודר לפי תאריך.',
  },
  {
    art: <ArtTile icon="box" size={60} />,
    title: 'מחסן ציוד משותף',
    text: 'רואים מה פנוי ולוקחים בלחיצה. גם אם שתי מדריכות לוחצות באותו רגע, רק אחת מקבלת את המקרן.',
  },
]

export function Home() {
  const { session } = useAuth()
  if (session) return <Navigate to="/dashboard" replace />

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">ניהול סניף בלי כאב ראש</span>
          <h1>
            התקציב, המפגשים והציוד
            <br />
            <span className="highlight">זורמים במקום אחד</span>
          </h1>
          <p>
            BudgetFlow עוזרת לרכזת ולמדריכות לנהל את הסניף: לדווח מפגשים, לעקוב אחרי כל שקל בקופות, ולשתף ציוד
            בלי ריבים.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary btn-large">
              כניסה למערכת
            </Link>
            <Link to="/register" className="btn btn-ghost btn-large">
              רישום רכזת
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <FlowOrbit />
        </div>
      </section>

      <section className="features">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 120}>
            <div className="feature-card">
              <div className="feature-art">{f.art}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <Reveal>
        <section className="steps">
          <h2>איך זה עובד?</h2>
          <ol>
            <li>
              <span className="step-num">1</span>הרכזת נרשמת ומוסיפה את המדריכות.
            </li>
            <li>
              <span className="step-num">2</span>כל מדריכה מוסיפה את החניכות שלה.
            </li>
            <li>
              <span className="step-num">3</span>מדווחים מפגשים, והתקציב מתעדכן מעצמו.
            </li>
          </ol>
        </section>
      </Reveal>
    </div>
  )
}
