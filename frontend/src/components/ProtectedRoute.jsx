import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-8 text-gray-500">Loading...</p>
  return user ? children : <Navigate to="/login" replace />
}
