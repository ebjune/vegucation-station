export interface ImageSearchResult {
  imageUrl: string
  sourceUrl: string
  creditName?: string
  creditUrl?: string
  license?: string
}

function buildSearchQuery(produceName: string, categoryName?: string): string {
  const foodCategoryHints: Record<string, string> = {
    Vegetables: 'vegetable',
    Fruits: 'fruit',
    'Eggs & Dairy': 'food',
    Mushrooms: 'mushroom',
    'Herbs & Microgreens': 'herb',
    Other: 'food',
  }

  const hint = categoryName ? foodCategoryHints[categoryName] : undefined
  return hint ? `${produceName} ${hint}` : produceName
}

async function searchPexels(query: string): Promise<ImageSearchResult | null> {
  const apiKey = process.env.PEXELS_API_KEY?.trim()
  if (!apiKey) return null

  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '5')
  url.searchParams.set('orientation', 'square')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: apiKey,
    },
  })

  if (!response.ok) {
    console.error('Pexels search failed:', response.status, await response.text())
    return null
  }

  const data = (await response.json()) as {
    photos?: Array<{
      url: string
      photographer: string
      photographer_url: string
      src: {
        large2x?: string
        large?: string
        medium?: string
        original?: string
      }
    }>
  }

  const photo = data.photos?.[0]
  if (!photo) return null

  const imageUrl =
    photo.src.large2x || photo.src.large || photo.src.medium || photo.src.original
  if (!imageUrl) return null

  return {
    imageUrl,
    sourceUrl: photo.url,
    creditName: photo.photographer,
    creditUrl: photo.photographer_url,
    license: 'Pexels License',
  }
}

async function searchWikimedia(query: string): Promise<ImageSearchResult | null> {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', `${query} food`)
  url.searchParams.set('gsrnamespace', '6')
  url.searchParams.set('gsrlimit', '5')
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|extmetadata')
  url.searchParams.set('iiurlwidth', '800')

  const response = await fetch(url.toString())
  if (!response.ok) {
    console.error('Wikimedia search failed:', response.status)
    return null
  }

  const data = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title: string
          imageinfo?: Array<{
            url: string
            descriptionurl: string
            extmetadata?: Record<string, { value?: string }>
          }>
        }
      >
    }
  }

  const pages = data.query?.pages
  if (!pages) return null

  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0]
    if (!info?.url) continue

    const metadata = info.extmetadata ?? {}
    const artist = metadata.Artist?.value?.replace(/<[^>]+>/g, '').trim()
    const license = metadata.LicenseShortName?.value?.replace(/<[^>]+>/g, '').trim()

    return {
      imageUrl: info.url,
      sourceUrl: info.descriptionurl,
      creditName: artist || 'Wikimedia Commons',
      creditUrl: info.descriptionurl,
      license: license || 'Creative Commons',
    }
  }

  return null
}

export async function searchProduceImage(
  produceName: string,
  categoryName?: string
): Promise<ImageSearchResult | null> {
  const query = buildSearchQuery(produceName, categoryName)

  try {
    const pexelsResult = await searchPexels(query)
    if (pexelsResult) return pexelsResult
  } catch (error) {
    console.error('Pexels image search error:', error)
  }

  try {
    return await searchWikimedia(produceName)
  } catch (error) {
    console.error('Wikimedia image search error:', error)
    return null
  }
}
