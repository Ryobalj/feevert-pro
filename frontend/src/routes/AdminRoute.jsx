import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/accounts/hooks/useAuth'

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  const { user, loading, isAdmin } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (user && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute
