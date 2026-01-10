import type { Recipe } from '../database/repository'

// Thermal printer service placeholder
// In production, integrate with escpos, node-thermal-printer, or similar

interface PrinterConfig {
  enabled: boolean
  type: 'escpos' | 'star' | 'epson' | 'none'
  interface: 'usb' | 'serial' | 'network'
  path?: string // USB device path or serial port
  host?: string // Network printer host
  port?: number // Network printer port
  width: number // Characters per line (typically 48 for 80mm paper)
}

// Default config - disabled until configured
const printerConfig: PrinterConfig = {
  enabled: false,
  type: 'none',
  interface: 'usb',
  width: 48,
}

function formatRecipeForPrint(recipe: Recipe, width: number): string {
  const separator = '='.repeat(width)
  const thinSeparator = '-'.repeat(width)

  const lines: string[] = []

  // Header
  lines.push(separator)
  lines.push(centerText(recipe.title.toUpperCase(), width))
  lines.push(separator)
  lines.push('')

  // Description
  lines.push(...wrapText(recipe.description, width))
  lines.push('')

  // Meta info
  lines.push(thinSeparator)
  lines.push(`Prep: ${recipe.prepTime}`)
  lines.push(`Difficulty: ${recipe.difficulty}`)
  lines.push(`Servings: ${recipe.servings}`)
  lines.push(thinSeparator)
  lines.push('')

  // Ingredients
  lines.push(centerText('INGREDIENTS', width))
  lines.push('')
  for (const ingredient of recipe.ingredients) {
    lines.push(...wrapText(`* ${ingredient}`, width, 2))
  }
  lines.push('')

  // Steps
  lines.push(centerText('INSTRUCTIONS', width))
  lines.push('')
  recipe.steps.forEach((step, index) => {
    lines.push(...wrapText(`${index + 1}. ${step}`, width, 3))
    lines.push('')
  })

  return lines.join('\n')
}

function centerText(text: string, width: number): string {
  if (text.length >= width) return text
  const padding = Math.floor((width - text.length) / 2)
  return ' '.repeat(padding) + text
}

function wrapText(text: string, width: number, indent: number = 0): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  const indentStr = ' '.repeat(indent)
  const effectiveWidth = width - indent

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= effectiveWidth) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) {
        lines.push((lines.length > 0 ? indentStr : '') + currentLine)
      }
      currentLine = word
    }
  }

  if (currentLine) {
    lines.push((lines.length > 0 ? indentStr : '') + currentLine)
  }

  return lines
}

export async function printRecipes(recipes: Recipe[]): Promise<boolean> {
  if (!printerConfig.enabled || printerConfig.type === 'none') {
    console.log('Printer not configured')
    return false
  }

  try {
    const output = recipes.map((recipe) =>
      formatRecipeForPrint(recipe, printerConfig.width)
    ).join('\n\n' + '='.repeat(printerConfig.width) + '\n\n')

    // Add header and footer
    const header = [
      '='.repeat(printerConfig.width),
      centerText('VEGUCATION STATION', printerConfig.width),
      centerText('Farmers Market Recipes', printerConfig.width),
      '='.repeat(printerConfig.width),
      '',
    ].join('\n')

    const footer = [
      '',
      '-'.repeat(printerConfig.width),
      centerText('Thank you for visiting!', printerConfig.width),
      centerText('Support local farmers', printerConfig.width),
      '-'.repeat(printerConfig.width),
      '\n\n\n', // Extra lines for paper feed
    ].join('\n')

    const fullOutput = header + output + footer

    console.log('Would print:')
    console.log(fullOutput)

    // In production, send to actual printer:
    // if (printerConfig.type === 'escpos') {
    //   const escpos = require('escpos')
    //   const device = new escpos.USB()
    //   const printer = new escpos.Printer(device)
    //   device.open(() => {
    //     printer.text(fullOutput).cut().close()
    //   })
    // }

    return true
  } catch (error) {
    console.error('Error printing recipes:', error)
    return false
  }
}

export function isPrinterAvailable(): boolean {
  return printerConfig.enabled && printerConfig.type !== 'none'
}

// Export for testing
export { formatRecipeForPrint }
