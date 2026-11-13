import type { MetadataRoute } from 'next'
import { siteUrl } from '../lib/seo/siteUrl'

// Served at /robots.txt. It exists to point crawlers at the sitemap — the
// `Sitemap:` line is how a search engine finds one it has not been told about.
//
// Deliberately NO Disallow rules. Until this file existed /robots.txt returned
// 404, which means "crawl everything", so allowing everything changes nothing
// about what is crawled. Blocking private areas is a separate decision: a
// Disallow does not keep a URL out of the index (that is `noindex`), and
// getting it wrong can hide pages that should be found.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
