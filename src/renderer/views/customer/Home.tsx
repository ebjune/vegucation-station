import { useNavigate } from 'react-router-dom'
import TouchButton from '../shared/TouchButton'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-cream to-primary-50">
      {/* Welcome Message */}
      <div className="text-center mb-12">
        <h2 className="text-touch-3xl font-bold text-earth-800 mb-4">
          Welcome to the Market!
        </h2>
        <p className="text-touch-lg text-earth-800/70 max-w-xl">
          Discover fresh produce, learn fun facts, and find delicious recipes
          using ingredients from your local farmers market.
        </p>
      </div>

      {/* Decorative produce icons */}
      <div className="flex gap-4 mb-12 text-6xl">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🥕</span>
        <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🍅</span>
        <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🥬</span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🍎</span>
        <span className="animate-bounce" style={{ animationDelay: '400ms' }}>🍄</span>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-6">
        <TouchButton
          variant="primary"
          size="lg"
          icon="🔍"
          onClick={() => navigate('/browse')}
          className="min-w-[280px]"
        >
          Explore Produce
        </TouchButton>

        <TouchButton
          variant="secondary"
          size="lg"
          icon="📖"
          onClick={() => navigate('/recipes')}
          className="min-w-[280px]"
        >
          Get Recipes
        </TouchButton>
      </div>

      {/* Subtitle */}
      <p className="mt-12 text-touch-sm text-earth-800/50">
        Tap a button to get started!
      </p>
    </div>
  )
}
