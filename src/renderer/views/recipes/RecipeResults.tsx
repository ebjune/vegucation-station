import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../../viewmodels/useRecipeStore'
import TouchButton from '../shared/TouchButton'
import LoadingSpinner from '../shared/LoadingSpinner'
import RecipeCard from './RecipeCard'

export default function RecipeResults() {
  const navigate = useNavigate()
  const {
    recipes,
    selectedIngredients,
    isGenerating,
    error,
    sendEmail,
    emailSending,
    emailSent,
    resetEmailState,
    clearIngredients,
  } = useRecipeStore()

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailRecipeIndex, setEmailRecipeIndex] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [printingIndex, setPrintingIndex] = useState<number | null>(null)
  const [printError, setPrintError] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI.isEmailEnabled().then(setEmailEnabled)
  }, [])

  const handleToggleRecipe = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  const handleStartOver = () => {
    clearIngredients()
    navigate('/recipes')
  }

  const handleEmailRecipe = (index: number) => {
    setEmailRecipeIndex(index)
    setShowEmailModal(true)
  }

  const handlePrintRecipe = async (index: number) => {
    const recipe = recipes[index]
    setPrintError(null)
    setPrintingIndex(index)
    try {
      const result = await window.electronAPI.printRecipe(recipe)
      if (!result.ok) {
        setPrintError(result.error ?? 'Could not print this recipe.')
      }
    } catch (e) {
      console.error(e)
      setPrintError('Could not print this recipe. Please try again.')
    } finally {
      setPrintingIndex(null)
    }
  }

  const handleEmailSubmit = async () => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setEmailError('')
    const success = await sendEmail(email, emailRecipeIndex !== null ? emailRecipeIndex : undefined)

    if (success) {
      setTimeout(() => {
        setShowEmailModal(false)
        setEmailRecipeIndex(null)
        setEmail('')
        resetEmailState()
      }, 2000)
    }
  }

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner
          size="lg"
          message="Creating delicious recipes for you..."
        />
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <span className="text-6xl mb-4">🍳</span>
        <h3 className="text-touch-xl font-semibold text-earth-800 mb-2">
          No recipes yet
        </h3>
        <p className="text-touch-base text-earth-800/70 mb-6 text-center">
          Select some ingredients and we'll create recipes for you!
        </p>
        <TouchButton variant="primary" onClick={() => navigate('/recipes')}>
          Select Ingredients
        </TouchButton>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-touch-xl font-bold text-earth-800">
              Your Recipes
            </h2>
            <p className="text-touch-sm text-earth-800/70">
              Made with: {selectedIngredients.map((i) => i.name).join(', ')}
            </p>
          </div>
          <TouchButton variant="ghost" size="sm" onClick={handleStartOver}>
            Start Over
          </TouchButton>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-secondary-100 border border-secondary-300 rounded-touch">
          <p className="text-secondary-700">{error}</p>
        </div>
      )}

      {printError && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-touch flex justify-between gap-4 items-start">
          <p className="text-amber-900 text-touch-sm">{printError}</p>
          <button
            type="button"
            onClick={() => setPrintError(null)}
            className="text-touch-sm font-medium text-amber-800 hover:underline flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Recipe Cards */}
      <div className="flex-1 overflow-y-auto scroll-touch p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {recipes.map((recipe, index) => (
            <RecipeCard
              key={index}
              recipe={recipe}
              isExpanded={expandedIndex === index}
              onToggle={() => handleToggleRecipe(index)}
              onEmail={() => handleEmailRecipe(index)}
              onPrint={() => handlePrintRecipe(index)}
              emailEnabled={emailEnabled}
              isPrinting={printingIndex === index}
              printBusy={printingIndex !== null}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex gap-4 max-w-4xl mx-auto">
          <TouchButton
            variant="outline"
            onClick={() => navigate('/')}
            className="flex-1"
          >
            ← Home
          </TouchButton>
          <TouchButton
            variant="primary"
            onClick={handleStartOver}
            className="flex-1"
          >
            New Recipe Search
          </TouchButton>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-touch p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-touch-xl font-bold text-earth-800 mb-4">
              Email Recipe
            </h3>

            {emailSent ? (
              <div className="text-center py-8">
                <span className="text-6xl mb-4 block">✉️</span>
                <p className="text-touch-lg text-primary-600 font-semibold">
                  Recipe sent!
                </p>
              </div>
            ) : (
              <>
                {emailRecipeIndex !== null && (
                  <p className="text-touch-base font-semibold text-earth-800 mb-2">
                    {recipes[emailRecipeIndex].title}
                  </p>
                )}
                <p className="text-touch-sm text-earth-800/70 mb-4">
                  Enter your email address and we'll send you this recipe.
                </p>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-touch w-full mb-2 select-text"
                  autoFocus
                />

                {emailError && (
                  <p className="text-secondary-600 text-sm mb-4">{emailError}</p>
                )}

                <div className="flex gap-3 mt-6">
                  <TouchButton
                    variant="ghost"
                    onClick={() => {
                      setShowEmailModal(false)
                      setEmailRecipeIndex(null)
                      setEmail('')
                      setEmailError('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </TouchButton>
                  <TouchButton
                    variant="primary"
                    onClick={handleEmailSubmit}
                    disabled={emailSending}
                    className="flex-1"
                  >
                    {emailSending ? 'Sending...' : 'Send'}
                  </TouchButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
