import type { NutritionInfo as NutritionInfoType } from '../../models/EducationContent'

interface NutritionInfoProps {
  nutrition: NutritionInfoType
}

export default function NutritionInfo({ nutrition }: NutritionInfoProps) {
  const hasContent =
    nutrition.calories ||
    (nutrition.vitamins && nutrition.vitamins.length > 0) ||
    (nutrition.minerals && nutrition.minerals.length > 0) ||
    (nutrition.benefits && nutrition.benefits.length > 0)

  if (!hasContent) return null

  return (
    <div className="mb-8">
      <h3 className="text-touch-xl font-bold text-earth-800 mb-4 flex items-center gap-2">
        <span>🥗</span> Nutrition
      </h3>

      <div className="bg-white rounded-touch p-6 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calories */}
          {nutrition.calories && (
            <div>
              <h4 className="text-touch-base font-semibold text-earth-800 mb-2">
                Calories
              </h4>
              <p className="text-touch-sm text-earth-800/70">{nutrition.calories}</p>
            </div>
          )}

          {/* Vitamins */}
          {nutrition.vitamins && nutrition.vitamins.length > 0 && (
            <div>
              <h4 className="text-touch-base font-semibold text-earth-800 mb-2">
                Vitamins
              </h4>
              <div className="flex flex-wrap gap-2">
                {nutrition.vitamins.map((vitamin, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {vitamin}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Minerals */}
          {nutrition.minerals && nutrition.minerals.length > 0 && (
            <div>
              <h4 className="text-touch-base font-semibold text-earth-800 mb-2">
                Minerals
              </h4>
              <div className="flex flex-wrap gap-2">
                {nutrition.minerals.map((mineral, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium"
                  >
                    {mineral}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          {nutrition.benefits && nutrition.benefits.length > 0 && (
            <div className="md:col-span-2">
              <h4 className="text-touch-base font-semibold text-earth-800 mb-2">
                Health Benefits
              </h4>
              <ul className="space-y-2">
                {nutrition.benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-touch-sm text-earth-800/70"
                  >
                    <span className="text-primary-500 mt-1">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
