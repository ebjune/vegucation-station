import { useNavigate } from 'react-router-dom'
import { useSellerStore } from '../../viewmodels/useSellerStore'
import { useAppStore } from '../../viewmodels/useAppStore'

export default function PinEntry() {
  const navigate = useNavigate()
  const { pin, appendPin, clearPin, deleteLastDigit, verifyPin, isVerifying, verifyError } =
    useSellerStore()
  const { setSellerAuthenticated, setMode } = useAppStore()

  const handleDigitPress = (digit: string) => {
    appendPin(digit)
  }

  const handleSubmit = async () => {
    const isValid = await verifyPin()
    if (isValid) {
      setSellerAuthenticated(true)
      setMode('seller')
      navigate('/seller/manage')
    }
  }

  const handleCancel = () => {
    clearPin()
    navigate('/')
  }

  // Auto-submit when 4 digits entered
  const handleKeyPress = async (digit: string) => {
    handleDigitPress(digit)
    if (pin.length === 3) {
      // Will have 4 digits after this press
      setTimeout(handleSubmit, 100)
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-b from-cream to-primary-50">
      <div className="bg-white rounded-touch p-8 shadow-xl max-w-sm w-full">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🔐</span>
          <h2 className="text-touch-xl font-bold text-earth-800">Seller Mode</h2>
          <p className="text-touch-sm text-earth-800/70 mt-2">
            Enter your PIN to access
          </p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`
                w-14 h-14 rounded-xl border-2 flex items-center justify-center
                text-touch-2xl font-bold
                ${pin.length > index
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-gray-50'
                }
              `}
            >
              {pin.length > index ? '•' : ''}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {verifyError && (
          <p className="text-secondary-600 text-center text-sm mb-4">
            {verifyError}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              disabled={isVerifying}
              className="keypad-btn"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={clearPin}
            disabled={isVerifying}
            className="keypad-btn text-secondary-500 text-touch-base"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isVerifying}
            className="keypad-btn"
          >
            0
          </button>
          <button
            onClick={deleteLastDigit}
            disabled={isVerifying}
            className="keypad-btn text-touch-xl"
          >
            ⌫
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-touch text-earth-800 font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4 || isVerifying}
            className="flex-1 py-3 rounded-touch bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isVerifying ? 'Verifying...' : 'Enter'}
          </button>
        </div>
      </div>
    </div>
  )
}
