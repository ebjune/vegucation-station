export interface EducationContentData {
  funFacts: string[]
  nutritionInfo: Record<string, unknown>
  detailedInfo: string
}

export function createFallbackEducationContent(produceName: string): EducationContentData {
  return {
    funFacts: [
      `${produceName} is a nutritious food found at farmers markets!`,
      `Fresh ${produceName.toLowerCase()} tastes better than store-bought.`,
      `Many farmers grow ${produceName.toLowerCase()} using sustainable methods.`,
      `Ask the farmer about how they grow their ${produceName.toLowerCase()}!`,
    ],
    nutritionInfo: {
      benefits: ['Fresh produce is packed with nutrients!'],
    },
    detailedInfo: `${produceName} is a wonderful addition to any meal. Visit your local farmers market to find the freshest options and talk to the farmers about their growing practices.`,
  }
}

export function isFallbackEducationContent(content: EducationContentData): boolean {
  const hasFallbackFact = content.funFacts.some((fact) =>
    fact.includes('is a nutritious food found at farmers markets!')
  )

  const benefits = content.nutritionInfo.benefits
  const hasFallbackBenefits =
    Array.isArray(benefits) &&
    benefits.length === 1 &&
    benefits[0] === 'Fresh produce is packed with nutrients!'

  const hasFallbackDetail = content.detailedInfo.includes(
    'is a wonderful addition to any meal. Visit your local farmers market'
  )

  return hasFallbackFact && hasFallbackBenefits && hasFallbackDetail
}
