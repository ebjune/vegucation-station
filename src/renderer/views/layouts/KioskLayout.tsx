import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../viewmodels/useAppStore'
import OfflineBanner from '../shared/OfflineBanner'
import { useState, useRef, useEffect } from 'react'

export default function KioskLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isOnline, isSellerAuthenticated, logout } = useAppStore()

  // Clear seller auth when leaving seller routes (handles Exit Seller Mode)
  useEffect(() => {
    if (!location.pathname.startsWith('/seller') && isSellerAuthenticated) {
      logout()
    }
  }, [location.pathname, isSellerAuthenticated, logout])

  // Long-press detection for seller mode access
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null)
  const cornerRef = useRef<HTMLDivElement>(null)

  const handleCornerPress = () => {
    const timer = window.setTimeout(() => {
      // Navigate to seller mode on long press
      navigate('/seller')
    }, 2000) // 2 second long press
    setLongPressTimer(timer)
  }

  const handleCornerRelease = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

  const isSellerRoute = location.pathname.startsWith('/seller')
  const isHome = location.pathname === '/'

  return (
    <div className="h-screen w-screen flex flex-col bg-cream overflow-hidden">
      {/* Offline Banner */}
      {!isOnline && <OfflineBanner />}

      {/* Header */}
      <header className="flex-shrink-0 bg-primary-500 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <span className="text-4xl">🥬</span>
            <h1 className="text-touch-2xl font-bold">VegucationStation</h1>
          </button>

          <div className="flex items-center gap-4">
            {isSellerAuthenticated && isSellerRoute && (
              <button
                onClick={() => navigate('/', { replace: true })}
                className="px-4 py-2 bg-white/20 rounded-lg text-touch-sm font-medium hover:bg-white/30 transition-colors"
              >
                Exit Seller Mode
              </button>
            )}

            {!isHome && !isSellerRoute && (
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-white/20 rounded-lg text-touch-sm font-medium hover:bg-white/30 transition-colors"
              >
                Home
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Footer with hidden seller access */}
      <footer className="flex-shrink-0 bg-earth-800 text-cream/70 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <span>Learn about fresh produce at your local farmers market!</span>

          {/* Hidden corner for seller mode access */}
          <div
            ref={cornerRef}
            onMouseDown={handleCornerPress}
            onMouseUp={handleCornerRelease}
            onMouseLeave={handleCornerRelease}
            onTouchStart={handleCornerPress}
            onTouchEnd={handleCornerRelease}
            className="w-12 h-12 cursor-default"
            title=""
          />
        </div>
      </footer>
    </div>
  )
}
