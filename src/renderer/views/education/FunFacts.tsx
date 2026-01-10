interface FunFactsProps {
  facts: string[]
}

const FACT_ICONS = ['💡', '⭐', '🌟', '✨', '🎯', '🔍']

export default function FunFacts({ facts }: FunFactsProps) {
  if (!facts || facts.length === 0) return null

  return (
    <div className="mb-8">
      <h3 className="text-touch-xl font-bold text-earth-800 mb-4 flex items-center gap-2">
        <span>💡</span> Fun Facts
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facts.map((fact, index) => (
          <div
            key={index}
            className="bg-white rounded-touch p-5 shadow-md border-l-4 border-primary-400"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">
                {FACT_ICONS[index % FACT_ICONS.length]}
              </span>
              <p className="text-touch-base text-earth-800">{fact}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
