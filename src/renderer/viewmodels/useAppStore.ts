import { create } from 'zustand'

type AppMode = 'customer' | 'seller'

interface AppState {
  // Current mode
  mode: AppMode
  setMode: (mode: AppMode) => void

  // Online status
  isOnline: boolean
  setIsOnline: (online: boolean) => void

  // Loading state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Error state
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void

  // Seller authentication
  isSellerAuthenticated: boolean
  setSellerAuthenticated: (authenticated: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Mode
  mode: 'customer',
  setMode: (mode) => set({ mode }),

  // Online status
  isOnline: navigator.onLine,
  setIsOnline: (isOnline) => set({ isOnline }),

  // Loading
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  // Error
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Seller auth
  isSellerAuthenticated: false,
  setSellerAuthenticated: (isSellerAuthenticated) => set({ isSellerAuthenticated }),
  logout: () => set({ isSellerAuthenticated: false, mode: 'customer' }),
}))

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setIsOnline(true)
  })

  window.addEventListener('offline', () => {
    useAppStore.getState().setIsOnline(false)
  })
}
