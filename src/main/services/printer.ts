import { BrowserWindow, type WebContentsPrintOptions } from 'electron'
import type { Recipe } from '../database/repository'

/** Micrometers per millimeter (Chromium print page dimensions). */
const UM_PER_MM = 1000

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeWithLineBreaks(s: string): string {
  return escapeHtml(s).replace(/\r\n|\r|\n/g, '<br>')
}

/**
 * Compact HTML for 80mm thermal roll: small type, tight leading, full width,
 * one logical "page" height in @page to discourage Chromium from paginating
 * every ~11in (driver still may cut at end of job).
 */
export function buildRecipeReceiptHtml(recipe: Recipe): string {
  const title = escapeHtml(recipe.title)
  const description = escapeWithLineBreaks(recipe.description)
  const prep = escapeHtml(recipe.prepTime)
  const difficulty = escapeHtml(recipe.difficulty)
  const servings = escapeHtml(String(recipe.servings))

  const ingredientsHtml = recipe.ingredients
    .map((ing) => `<li>${escapeHtml(ing)}</li>`)
    .join('')

  const stepsHtml = recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: 80mm 3000mm;
      margin: 0;
    }
    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      /* Extra padding on the right — many 80mm drivers clip ~1–2mm past the logical edge */
      padding: 1.5mm 4mm 4mm 2.5mm;
      box-sizing: border-box;
      width: 100%;
      max-width: 72mm;
      font-family: Arial, Helvetica, "Helvetica Neue", "Segoe UI", sans-serif;
      font-size: 8.5pt;
      line-height: 1.18;
      color: #000;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }
    h1 {
      font-size: 10pt;
      font-weight: 700;
      margin: 0 0 1.5mm;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      border-bottom: 1px solid #000;
      padding-bottom: 1mm;
    }
    .desc { margin: 0 0 2mm; font-size: 8pt; }
    .meta {
      font-size: 7.5pt;
      margin: 0 0 2mm;
      padding-bottom: 1.5mm;
      border-bottom: 1px dashed #000;
    }
    h2 {
      font-size: 8.5pt;
      margin: 2mm 0 1mm;
      font-weight: 700;
    }
    ul, ol {
      margin: 0;
      padding-left: 3.2mm;
    }
    li { margin: 0 0 1mm; }
    .footer {
      margin-top: 3mm;
      padding-top: 2mm;
      border-top: 1px solid #000;
      font-size: 7pt;
      color: #222;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="desc">${description}</p>
  <p class="meta">Prep: ${prep} · ${difficulty} · Serves ${servings}</p>
  <h2>Ingredients</h2>
  <ul>${ingredientsHtml}</ul>
  <h2>Instructions</h2>
  <ol>${stepsHtml}</ol>
  <p class="footer">VegucationStation · Farmers Market</p>
</body>
</html>`
}

function parseEnvInt(key: string, fallback: number): number {
  const raw = process.env[key]
  if (raw === undefined || raw === '') return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function getPageSizeMicrons(): { width: number; height: number } {
  const widthMm = parseEnvInt('RECIPE_PRINT_PAGE_WIDTH_MM', 80)
  const heightMm = parseEnvInt('RECIPE_PRINT_PAGE_HEIGHT_MM', 3000)
  return {
    width: widthMm * UM_PER_MM,
    height: heightMm * UM_PER_MM,
  }
}

function getPrintOptions(): WebContentsPrintOptions {
  const silent = process.env.RECIPE_PRINT_SILENT !== 'false'
  const deviceName = (process.env.RECIPE_PRINTER_NAME || 'POS-80').trim()
  const scaleRaw = process.env.RECIPE_PRINT_SCALE
  let scaleFactor: number | undefined
  if (scaleRaw !== undefined && scaleRaw !== '') {
    const s = Number.parseFloat(scaleRaw)
    if (Number.isFinite(s) && s > 0.2 && s <= 2) scaleFactor = s
  }

  const opts: WebContentsPrintOptions = {
    silent,
    printBackground: false,
    deviceName: deviceName || undefined,
    margins: { marginType: 'none' },
    landscape: false,
    pageSize: getPageSizeMicrons(),
  }
  if (scaleFactor !== undefined) opts.scaleFactor = scaleFactor
  return opts
}

export interface PrintRecipeResult {
  ok: boolean
  error?: string
}

/**
 * Prints a single recipe to the configured Windows printer (GDI driver)
 * without opening the system print dialog (when RECIPE_PRINT_SILENT is not "false").
 */
export function printRecipe(recipe: Recipe): Promise<PrintRecipeResult> {
  const html = buildRecipeReceiptHtml(recipe)
  const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)

  return new Promise((resolve) => {
    let completed = false
    const win = new BrowserWindow({
      show: false,
      width: 400,
      height: 600,
      webPreferences: {
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    const finish = (result: PrintRecipeResult) => {
      if (completed) return
      completed = true
      if (!win.isDestroyed()) win.close()
      resolve(result)
    }

    win.webContents.once('did-fail-load', (_e, code, desc) => {
      finish({ ok: false, error: `Failed to load print layout (${code}): ${desc}` })
    })

    void win
      .loadURL(dataUrl)
      .then(() => {
        const options = getPrintOptions()
        win.webContents.print(options, (success, failureReason) => {
          if (success) finish({ ok: true })
          else {
            const hint =
              ' If the job did not print, set RECIPE_PRINTER_NAME in .env to the exact ' +
              'name shown in Windows Settings → Printers (Electron requires the system printer name).'
            finish({
              ok: false,
              error: (failureReason || 'Print failed') + hint,
            })
          }
        })
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        finish({ ok: false, error: msg })
      })
  })
}
