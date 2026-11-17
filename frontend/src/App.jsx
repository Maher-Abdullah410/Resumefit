import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ContactPage, InfoPage } from './pages/InfoPages.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analyze from './pages/Analyze.jsx'
import Login from './pages/Login.jsx'
import Results from './pages/Results.jsx'
import Rewrite from './pages/Rewrite.jsx'
import Signup from './pages/Signup.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<InfoPage page="about" />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<InfoPage page="privacy" />} />
      <Route path="/terms" element={<InfoPage page="terms" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/analyze" element={<ProtectedRoute><Analyze /></ProtectedRoute>} />
      <Route path="/analyses/:analysisId" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/analyses/:analysisId/rewrite" element={<ProtectedRoute><Rewrite /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
