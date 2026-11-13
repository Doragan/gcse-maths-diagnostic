import type { MetadataRoute } from 'next'
import { briefedSkillIds } from '../data/skillBriefings'
import { investigatedSkillIds } from '../data/investigations'
import { buildSitemapEntries } from '../lib/seo/sitemap'
import { siteUrl } from '../lib/seo/siteUrl'

// Served at /sitemap.xml. What is in it, and what is deliberately not, is
// decided in lib/seo/sitemap.ts. Built from the in-repo registries, so a new
// briefing or investigation appears here with no change to this file.
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries(siteUrl(), briefedSkillIds(), investigatedSkillIds())
}
