import { Navigate } from 'react-router-dom'
import { useAppStore } from '../../viewmodels/useAppStore'

export default function SellerRoute({ children }: { children: React.ReactNode }) {
  const { isSellerAuthenticated } = useAppStore()

  if (!isSellerAuthenticated) {
    return <Navigate to="/seller" replace />
  }

  return <>{children}</>
}
