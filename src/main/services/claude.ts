import Anthropic from '@anthropic-ai/sdk'
import type { Recipe } from '../database/repository'
import { createFallbackEducationContent } from './educationFallback'

const EXPECTED_RECIPE_COUNT = 3

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

function extractJsonFromResponse(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  const arrayStart = trimmed.indexOf('[')
  const arrayEnd = trimmed.lastIndexOf(']')
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1)
  }

  return trimmed
}

function isValidRecipe(recipe: unknown): recipe is Recipe {
  if (!recipe || typeof recipe !== 'object') return false
  const r = recipe as Record<string, unknown>
  return (
    typeof r.title === 'string' &&
    typeof r.description === 'string' &&
    typeof r.prepTime === 'string' &&
    typeof r.difficulty === 'string' &&
    typeof r.servings === 'number' &&
    Array.isArray(r.ingredients) &&
    Array.isArray(r.steps)
  )
}

function parseRecipeArray(text: string): Recipe[] {
  const recipes = JSON.parse(extractJsonFromResponse(text)) as unknown
  if (!Array.isArray(recipes)) {
    throw new Error('Recipe response was not a JSON array')
  }

  const validRecipes = recipes.filter(isValidRecipe)
  if (validRecipes.length < EXPECTED_RECIPE_COUNT) {
    throw new Error(`Expected ${EXPECTED_RECIPE_COUNT} recipes, received ${validRecipes.length}`)
  }

  return validRecipes.slice(0, EXPECTED_RECIPE_COUNT)
}

function createFallbackRecipes(ingredients: string[]): Recipe[] {
  const primary = ingredients[0]
  const secondary = ingredients[1] ?? primary
  const ingredientList = ingredients.map((item) => item.toLowerCase()).join(', ')

  return [
    {
      title: `Fresh ${primary} Salad`,
      description: `A simple, fresh salad featuring ${primary.toLowerCase()} from the farmers market.`,
      prepTime: '10 minutes',
      difficulty: 'Easy',
      servings: 4,
      ingredients: [
        `Fresh ${primary.toLowerCase()}`,
        secondary !== primary ? `Fresh ${secondary.toLowerCase()}` : 'Mixed greens',
        'Olive oil',
        'Lemon juice',
        'Salt and pepper to taste',
      ],
      steps: [
        `Wash and prepare the ${primary.toLowerCase()}.`,
        'Arrange on a plate.',
        'Drizzle with olive oil and lemon juice.',
        'Season with salt and pepper.',
      ],
    },
    {
      title: `${primary} and ${secondary} Skillet`,
      description: `A quick weeknight skillet using ${ingredientList} from the market.`,
      prepTime: '25 minutes',
      difficulty: 'Medium',
      servings: 4,
      ingredients: [
        `2 cups ${primary.toLowerCase()}, chopped`,
        secondary !== primary ? `1 cup ${secondary.toLowerCase()}, sliced` : '1 small onion, sliced',
        '2 tablespoons olive oil',
        '2 cloves garlic, minced',
        'Salt and pepper to taste',
      ],
      steps: [
        'Heat olive oil in a large skillet over medium heat.',
        `Add garlic and cook until fragrant, about 30 seconds.`,
        `Add ${primary.toLowerCase()}${secondary !== primary ? ` and ${secondary.toLowerCase()}` : ''} and cook until tender.`,
        'Season with salt and pepper and serve warm.',
      ],
    },
    {
      title: `Farmers Market ${primary} Bake`,
      description: `A more adventurous baked dish that lets ${ingredientList} shine.`,
      prepTime: '45 minutes',
      difficulty: 'Advanced',
      servings: 6,
      ingredients: [
        `3 cups ${primary.toLowerCase()}, prepared`,
        secondary !== primary ? `1 cup ${secondary.toLowerCase()}` : '1/2 cup grated cheese',
        '1 cup broth or cream',
        '1 tablespoon fresh herbs',
        'Salt and pepper to taste',
      ],
      steps: [
        'Preheat the oven to 375°F (190°C).',
        `Layer ${primary.toLowerCase()}${secondary !== primary ? ` with ${secondary.toLowerCase()}` : ''} in a baking dish.`,
        'Pour broth or cream over the top and season well.',
        'Bake for 30-35 minutes until bubbling and golden.',
        'Garnish with fresh herbs before serving.',
      ],
    },
  ]
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
- Use a DIFFERENT topic for each fact (e.g. how it grows, colors/shapes, animals that eat it, fun science, cooking uses, where it's grown today, seasonal timing)
- Do NOT use historical clichés or repetitive patterns — avoid Ancient Romans, ancient Egyptians, medieval times, "did you know people have eaten this for thousands of years", or similar stock trivia
- Facts should feel fresh and varied, not like a template

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
  }

  return createFallbackEducationContent(produceName)
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
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    if (response.stop_reason === 'max_tokens') {
      throw new Error('Recipe response was truncated')
    }

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    return parseRecipeArray(textContent.text)
  } catch (error) {
    console.error('Error generating recipes:', error)
    return createFallbackRecipes(ingredients)
  }
}
