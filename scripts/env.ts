/**
 * Loads .env.local into process.env for standalone scripts.
 * Next.js does this automatically for the app, but not for `npx tsx` scripts.
 *
 * Import this at the top of any script before creating the Supabase client:
 *   import './env'
 */
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding quotes, matching how Next.js / dotenv load .env.local
    // (values from `vercel env pull` are quoted). Without this, scripts saw the
    // quote characters as part of the value.
    if (val.length >= 2 && ((val[0] === '"' && val.at(-1) === '"') || (val[0] === "'" && val.at(-1) === "'"))) {
      val = val.slice(1, -1)
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val
    }
  }
}
