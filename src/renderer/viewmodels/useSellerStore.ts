import { create } from 'zustand'

interface SellerState {
  // PIN entry
  pin: string
  setPin: (pin: string) => void
  appendPin: (digit: string) => void
  clearPin: () => void
  deleteLastDigit: () => void

  // Authentication
  isVerifying: boolean
  verifyError: string | null
  verifyPin: () => Promise<boolean>

  // Search filter for produce manager
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const PIN_LENGTH = 4

export const useSellerStore = create<SellerState>((set, get) => ({
  pin: '',
  isVerifying: false,
  verifyError: null,
  searchQuery: '',

  setPin: (pin) => {
    if (pin.length <= PIN_LENGTH && /^\d*$/.test(pin)) {
      set({ pin, verifyError: null })
    }
  },

  appendPin: (digit) => {
    const { pin } = get()
    if (pin.length < PIN_LENGTH && /^\d$/.test(digit)) {
      set({ pin: pin + digit, verifyError: null })
    }
  },

  clearPin: () => set({ pin: '', verifyError: null }),

  deleteLastDigit: () => {
    const { pin } = get()
    set({ pin: pin.slice(0, -1), verifyError: null })
  },

  verifyPin: async () => {
    const { pin } = get()

    if (pin.length !== PIN_LENGTH) {
      set({ verifyError: 'Please enter a 4-digit PIN' })
      return false
    }

    set({ isVerifying: true, verifyError: null })

    try {
      const isValid = await window.electronAPI.verifyPin(pin)

      if (isValid) {
        set({ isVerifying: false, pin: '' })
        return true
      } else {
        set({
          isVerifying: false,
          verifyError: 'Incorrect PIN. Please try again.',
          pin: '',
        })
        return false
      }
    } catch (error) {
      console.error('PIN verification failed:', error)
      set({
        isVerifying: false,
        verifyError: 'Unable to verify PIN. Please try again.',
      })
      return false
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))
