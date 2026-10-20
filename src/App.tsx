import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { Chair } from './components/Art'
import { FeedbackProvider } from './components/Feedback'
import { Layout, RequireAuth } from './components/Layout'
import { EmptyState } from './components/ui'
import { Additions } from './pages/Additions'
import { BranchParticipants } from './pages/BranchParticipants'
import { Login, Register } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { Equipment } from './pages/Equipment'
import { GuidePage, Guides } from './pages/Guides'
import { Home } from './pages/Home'
import { MeetingDetails, MeetingForm, MeetingsList } from './pages/Meetings'
import { Participants } from './pages/Participants'

function NotFound() {
  return (
    <div className="page">
      <EmptyState
        art={<Chair size={90} />}
        title="הדף לא נמצא"
        text="כנראה שהכיסא הזה ריק. בואי נחזור הביתה."
        action={
          <Link to="/" className="btn btn-primary">
            לדף הבית
          </Link>
        }
      />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FeedbackProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/participants" element={<Participants />} />
                <Route path="/meetings" element={<MeetingsList />} />
                <Route path="/meetings/new" element={<MeetingForm />} />
                <Route path="/meetings/:id" element={<MeetingDetails />} />
                <Route path="/meetings/:id/edit" element={<MeetingForm />} />
                <Route path="/equipment" element={<Equipment />} />
              </Route>

              <Route element={<RequireAuth coordinatorOnly />}>
                <Route path="/guides" element={<Guides />} />
                <Route path="/guides/:id" element={<GuidePage />} />
                <Route path="/additions" element={<Additions />} />
                <Route path="/branch-participants" element={<BranchParticipants />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
