import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Medias from './pages/Medias'
import Apps from './pages/Apps'
import Playlists from './pages/Playlists'
import PlaylistEditor from './pages/PlaylistEditor'
import Compositions from './pages/Compositions'
import CompositionEditor from './pages/CompositionEditor'
import Programmation from './pages/Programmation'
import Ecrans from './pages/Ecrans'
import Utilisateurs from './pages/Utilisateurs'
import Messagerie from './pages/Messagerie'
import Geolocalisation from './pages/Geolocalisation'
import SuperAdminPlans from './pages/superadmin/Plans'
import SuperAdminEmail from './pages/superadmin/EmailSettings'
import SuperAdminSettings from './pages/superadmin/Settings'
import SuperAdminTheme from './pages/superadmin/Theme'
import SuperAdminBranding from './pages/superadmin/Branding'
import SuperAdminMenu from './pages/superadmin/MenuNav'
import SuperAdminWidgets from './pages/superadmin/Widgets'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="medias" element={<Medias />} />
          <Route path="apps" element={<Apps />} />
          <Route path="playlists" element={<Playlists />} />
          <Route path="playlists/:id" element={<PlaylistEditor />} />
          <Route path="compositions" element={<Compositions />} />
          <Route path="compositions/:id" element={<CompositionEditor />} />
          <Route path="programmation" element={<Programmation />} />
          <Route path="ecrans" element={<Ecrans />} />
          <Route path="utilisateurs" element={<RequireAdmin><Utilisateurs /></RequireAdmin>} />
          <Route path="messagerie" element={<RequireAdmin><Messagerie /></RequireAdmin>} />
          <Route path="geolocalisation" element={<RequireAdmin><Geolocalisation /></RequireAdmin>} />
          <Route path="superadmin/plans" element={<RequireAdmin><SuperAdminPlans /></RequireAdmin>} />
          <Route path="superadmin/email" element={<RequireAdmin><SuperAdminEmail /></RequireAdmin>} />
          <Route path="superadmin/settings" element={<RequireAdmin><SuperAdminSettings /></RequireAdmin>} />
          <Route path="superadmin/theme" element={<RequireAdmin><SuperAdminTheme /></RequireAdmin>} />
          <Route path="superadmin/branding" element={<RequireAdmin><SuperAdminBranding /></RequireAdmin>} />
          <Route path="superadmin/menu" element={<RequireAdmin><SuperAdminMenu /></RequireAdmin>} />
          <Route path="superadmin/widgets" element={<RequireAdmin><SuperAdminWidgets /></RequireAdmin>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
