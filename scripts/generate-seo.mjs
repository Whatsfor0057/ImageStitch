import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const rawSiteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL
if (!rawSiteUrl) {
  console.log('SEO: SITE_URL is not set; canonical URL and sitemap were skipped.')
  process.exit(0)
}

let siteUrl
try {
  siteUrl = new URL(rawSiteUrl)
} catch {
  throw new Error('SITE_URL must be an absolute URL, for example https://example.com')
}

siteUrl.pathname = '/'
siteUrl.search = ''
siteUrl.hash = ''
const canonical = siteUrl.toString()
const publicUrl = canonical.replace(/\/$/, '')
const distDirectory = resolve('dist')
const indexPath = resolve(distDirectory, 'index.html')
let html = await readFile(indexPath, 'utf8')
const tags = [
  `<link rel="canonical" href="${canonical}">`,
  `<meta property="og:url" content="${canonical}">`,
  `<meta property="og:image" content="${publicUrl}/social-card.svg">`,
  `<meta name="twitter:image" content="${publicUrl}/social-card.svg">`,
].join('\n    ')
html = html.replace('</head>', `    ${tags}\n  </head>`)
await writeFile(indexPath, html)

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${canonical}</loc></url>
</urlset>
`
await writeFile(resolve(distDirectory, 'sitemap.xml'), sitemap)
await writeFile(resolve(distDirectory, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${publicUrl}/sitemap.xml\n`)
console.log(`SEO: generated canonical metadata and sitemap for ${canonical}`)
