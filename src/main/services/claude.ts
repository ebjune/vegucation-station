import Anthropic from '@anthropic-ai/sdk'
import type { Recipe } from '../database/repository'

// Lazy-initialize the Anthropic client (after dotenv loads)
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    console.log('Initializing Anthropic client with API key:', !!process.env.ANTHROPIC_API_KEY)
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

interface EducationContentResponse {
  funFacts: string[]
  nutritionInfo: {
    calories?: string
    vitamins?: string[]
    minerals?: string[]
    benefits?: string[]
  }
  detailedInfo: string
}

export async function generateEducationContent(
  produceName: string
): Promise<EducationContentResponse> {
  const prompt = `You are creating educational content for a farmers market kiosk called VegucationStation.
Target audience: Children ages 6-12 (primary) and adults (secondary).

Generate engaging, accurate content for: ${produceName}

Provide a JSON response with exactly this structure:
{
  "funFacts": ["fact 1", "fact 2", "fact 3", "fact 4"],
  "nutritionInfo": {
    "calories": "approximate calories per serving",
    "vitamins": ["vitamin A", "vitamin C", etc.],
    "minerals": ["potassium", "iron", etc.],
    "benefits": ["benefit 1", "benefit 2", "benefit 3"]
  },
  "detailedInfo": "2-3 paragraphs for adults covering: how it grows, when it's in season, how to select good ones at the market, and storage tips."
}

Requirements for funFacts:
- Each fact should be 1-2 sentences max
- Use kid-friendly language (simple words, fun comparisons)
- Include interesting trivia kids would enjoy sharing
- Make facts memorable and engaging

Requirements for nutritionInfo:
- Keep it simple and accessible
- Focus on key vitamins and minerals
- Benefits should be easy to understand

Requirements for detailedInfo:
- Write for curious adults who want to learn more
- Include seasonal information
- Add practical tips for selection and storage

Return ONLY valid JSON, no additional text or markdown.`

  try {
    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Parse the JSON response
    const content = JSON.parse(textContent.text) as EducationContentResponse
    return content
  } catch (error) {
    console.error('Error generating education content:', error)
    // Return fallback content if API fails
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
}

export async function generateRecipes(ingredients: string[]): Promise<Recipe[]> {
  const ingredientList = ingredients.join(', ')

  const prompt = `You are a helpful chef creating recipes for families shopping at a farmers market.

Create 3 delicious recipes using these farmers market ingredients: ${ingredientList}

Requirements:
- Family-friendly recipes suitable for home cooking
- Each recipe should feature at least one of the selected ingredients prominently
- Include a mix of difficulty levels (1 easy, 1 medium, 1 that's a bit more adventurous)
- Kid-friendly options are a plus

Provide a JSON response with exactly this structure:
[
  {
    "title": "Recipe Name",
    "description": "A brief, appetizing description (1-2 sentences)",
    "prepTime": "prep time (e.g., '15 minutes')",
    "difficulty": "Easy" | "Medium" | "Advanced",
    "servings": 4,
    "ingredients": [
      "1 cup ingredient",
      "2 tablespoons ingredient",
      etc.
    ],
    "steps": [
      "Step 1 instruction",
      "Step 2 instruction",
      etc.
    ]
  }
]

Return ONLY valid JSON array with exactly 3 recipes, no additional text or markdown.`

  try {
    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Parse the JSON response
    const recipes = JSON.parse(textContent.text) as Recipe[]
    return recipes
  } catch (error) {
    console.error('Error generating recipes:', error)
    // Return fallback recipes if API fails
    return [
      {
        title: `Fresh ${ingredients[0]} Salad`,
        description: `A simple, fresh salad featuring ${ingredients[0].toLowerCase()} from the farmers market.`,
        prepTime: '10 minutes',
        difficulty: 'Easy',
        servings: 4,
        ingredients: [
          `Fresh ${ingredients[0].toLowerCase()}`,
          'Olive oil',
          'Lemon juice',
          'Salt and pepper to taste',
        ],
        steps: [
          `Wash and prepare the ${ingredients[0].toLowerCase()}.`,
          'Arrange on a plate.',
          'Drizzle with olive oil and lemon juice.',
          'Season with salt and pepper.',
        ],
      },
    ]
  }
}
