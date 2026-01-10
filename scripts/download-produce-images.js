/**
 * Script to download royalty-free produce images
 * Using curated Pexels image URLs (royalty-free)
 * Run with: node scripts/download-produce-images.js
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.join(__dirname, '../src/renderer/public/produce-images')

// Curated image URLs from Pexels (royalty-free)
// Format: name -> Pexels photo ID (we'll construct the URL)
const PRODUCE_IMAGES = {
  // Vegetables
  'tomatoes': 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?w=400&h=400&fit=crop',
  'carrots': 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?w=400&h=400&fit=crop',
  'lettuce': 'https://images.pexels.com/photos/1199562/pexels-photo-1199562.jpeg?w=400&h=400&fit=crop',
  'spinach': 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?w=400&h=400&fit=crop',
  'kale': 'https://images.pexels.com/photos/51372/kale-vegetables-brassica-oleracea-var-sabellica-l-51372.jpeg?w=400&h=400&fit=crop',
  'zucchini': 'https://images.pexels.com/photos/128420/pexels-photo-128420.jpeg?w=400&h=400&fit=crop',
  'bell-peppers': 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?w=400&h=400&fit=crop',
  'cucumbers': 'https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?w=400&h=400&fit=crop',
  'broccoli': 'https://images.pexels.com/photos/1629862/pexels-photo-1629862.jpeg?w=400&h=400&fit=crop',
  'cauliflower': 'https://images.pexels.com/photos/6316515/pexels-photo-6316515.jpeg?w=400&h=400&fit=crop',
  'green-beans': 'https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?w=400&h=400&fit=crop',
  'corn': 'https://images.pexels.com/photos/547263/pexels-photo-547263.jpeg?w=400&h=400&fit=crop',
  'potatoes': 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?w=400&h=400&fit=crop',
  'sweet-potatoes': 'https://images.pexels.com/photos/89247/pexels-photo-89247.jpeg?w=400&h=400&fit=crop',
  'onions': 'https://images.pexels.com/photos/175414/pexels-photo-175414.jpeg?w=400&h=400&fit=crop',
  'garlic': 'https://images.pexels.com/photos/1638522/pexels-photo-1638522.jpeg?w=400&h=400&fit=crop',
  'beets': 'https://images.pexels.com/photos/3999245/pexels-photo-3999245.jpeg?w=400&h=400&fit=crop',
  'radishes': 'https://images.pexels.com/photos/4022082/pexels-photo-4022082.jpeg?w=400&h=400&fit=crop',
  'turnips': 'https://images.pexels.com/photos/5503106/pexels-photo-5503106.jpeg?w=400&h=400&fit=crop',
  'squash': 'https://images.pexels.com/photos/3850832/pexels-photo-3850832.jpeg?w=400&h=400&fit=crop',
  'pumpkin': 'https://images.pexels.com/photos/1527010/pexels-photo-1527010.jpeg?w=400&h=400&fit=crop',
  'eggplant': 'https://images.pexels.com/photos/5529589/pexels-photo-5529589.jpeg?w=400&h=400&fit=crop',
  'asparagus': 'https://images.pexels.com/photos/351679/pexels-photo-351679.jpeg?w=400&h=400&fit=crop',
  'celery': 'https://images.pexels.com/photos/8446609/pexels-photo-8446609.jpeg?w=400&h=400&fit=crop',
  'cabbage': 'https://images.pexels.com/photos/2518893/pexels-photo-2518893.jpeg?w=400&h=400&fit=crop',

  // Fruits
  'apples': 'https://images.pexels.com/photos/1510392/pexels-photo-1510392.jpeg?w=400&h=400&fit=crop',
  'peaches': 'https://images.pexels.com/photos/1028599/pexels-photo-1028599.jpeg?w=400&h=400&fit=crop',
  'strawberries': 'https://images.pexels.com/photos/1258261/pexels-photo-1258261.jpeg?w=400&h=400&fit=crop',
  'blueberries': 'https://images.pexels.com/photos/1395958/pexels-photo-1395958.jpeg?w=400&h=400&fit=crop',
  'raspberries': 'https://images.pexels.com/photos/1022385/pexels-photo-1022385.jpeg?w=400&h=400&fit=crop',
  'blackberries': 'https://images.pexels.com/photos/892808/pexels-photo-892808.jpeg?w=400&h=400&fit=crop',
  'watermelon': 'https://images.pexels.com/photos/1068534/pexels-photo-1068534.jpeg?w=400&h=400&fit=crop',
  'cantaloupe': 'https://images.pexels.com/photos/2894205/pexels-photo-2894205.jpeg?w=400&h=400&fit=crop',
  'grapes': 'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg?w=400&h=400&fit=crop',
  'pears': 'https://images.pexels.com/photos/568471/pexels-photo-568471.jpeg?w=400&h=400&fit=crop',
  'plums': 'https://images.pexels.com/photos/2227667/pexels-photo-2227667.jpeg?w=400&h=400&fit=crop',
  'cherries': 'https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg?w=400&h=400&fit=crop',

  // Eggs & Dairy
  'chicken-eggs': 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?w=400&h=400&fit=crop',
  'duck-eggs': 'https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?w=400&h=400&fit=crop',
  'goat-cheese': 'https://images.pexels.com/photos/4087609/pexels-photo-4087609.jpeg?w=400&h=400&fit=crop',
  'fresh-milk': 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?w=400&h=400&fit=crop',
  'butter': 'https://images.pexels.com/photos/531334/pexels-photo-531334.jpeg?w=400&h=400&fit=crop',

  // Mushrooms
  'shiitake': 'https://images.pexels.com/photos/4197439/pexels-photo-4197439.jpeg?w=400&h=400&fit=crop',
  'oyster-mushrooms': 'https://images.pexels.com/photos/5503136/pexels-photo-5503136.jpeg?w=400&h=400&fit=crop',
  'portobello': 'https://images.pexels.com/photos/36438/mushrooms-brown-mushrooms-cook-eat.jpg?w=400&h=400&fit=crop',
  'cremini': 'https://images.pexels.com/photos/1359269/pexels-photo-1359269.jpeg?w=400&h=400&fit=crop',
  'lions-mane': 'https://images.pexels.com/photos/6044283/pexels-photo-6044283.jpeg?w=400&h=400&fit=crop',

  // Herbs & Microgreens
  'basil': 'https://images.pexels.com/photos/1435901/pexels-photo-1435901.jpeg?w=400&h=400&fit=crop',
  'cilantro': 'https://images.pexels.com/photos/5503076/pexels-photo-5503076.jpeg?w=400&h=400&fit=crop',
  'parsley': 'https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?w=400&h=400&fit=crop',
  'mint': 'https://images.pexels.com/photos/2318044/pexels-photo-2318044.jpeg?w=400&h=400&fit=crop',
  'rosemary': 'https://images.pexels.com/photos/1580405/pexels-photo-1580405.jpeg?w=400&h=400&fit=crop',
  'thyme': 'https://images.pexels.com/photos/4198901/pexels-photo-4198901.jpeg?w=400&h=400&fit=crop',
  'dill': 'https://images.pexels.com/photos/3338497/pexels-photo-3338497.jpeg?w=400&h=400&fit=crop',
  'microgreens-mix': 'https://images.pexels.com/photos/4750270/pexels-photo-4750270.jpeg?w=400&h=400&fit=crop',
  'sunflower-sprouts': 'https://images.pexels.com/photos/1105019/pexels-photo-1105019.jpeg?w=400&h=400&fit=crop',

  // Other
  'honey': 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?w=400&h=400&fit=crop',
  'maple-syrup': 'https://images.pexels.com/photos/5765854/pexels-photo-5765854.jpeg?w=400&h=400&fit=crop',
  'jam': 'https://images.pexels.com/photos/5737580/pexels-photo-5737580.jpeg?w=400&h=400&fit=crop',
  'pickles': 'https://images.pexels.com/photos/5900554/pexels-photo-5900554.jpeg?w=400&h=400&fit=crop',
  'fresh-bread': 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?w=400&h=400&fit=crop',
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(OUTPUT_DIR, filename)

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`  Skipping ${filename} (already exists)`)
      return resolve()
    }

    const file = fs.createWriteStream(filepath)
    const urlObj = new URL(url)
    const protocol = urlObj.protocol === 'https:' ? https : require('http')

    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        fs.unlinkSync(filepath)
        return downloadImage(response.headers.location, filename).then(resolve).catch(reject)
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlinkSync(filepath)
        return reject(new Error(`HTTP ${response.statusCode}`))
      }

      response.pipe(file)

      file.on('finish', () => {
        file.close()
        console.log(`  Downloaded ${filename}`)
        resolve()
      })
    }).on('error', (err) => {
      file.close()
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
      reject(err)
    })
  })
}

async function downloadAll() {
  console.log('Downloading produce images from Pexels...\n')

  let downloaded = 0
  let failed = 0
  const entries = Object.entries(PRODUCE_IMAGES)

  for (const [name, url] of entries) {
    const filename = `${name}.jpg`

    try {
      await downloadImage(url, filename)
      downloaded++
      // Small delay to be respectful
      await new Promise(r => setTimeout(r, 200))
    } catch (err) {
      console.log(`  Failed to download ${filename}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nComplete! Downloaded: ${downloaded}, Failed: ${failed}`)
  console.log(`Images saved to: ${OUTPUT_DIR}`)
}

downloadAll().catch(console.error)
