// Fetch the PostgREST OpenAPI and save it to the repo (no secrets stored in the file)
import fs from 'fs'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rtgiakccgqqumddeyixs.supabase.co'
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' // optional at runtime

const res = await fetch(`${url}/rest/v1/`, {
  headers: {
    Accept: 'application/openapi+json',
    ...(anon ? { apikey: anon, Authorization: `Bearer ${anon}` } : {})
  }
})
if (!res.ok) {
  console.error('Failed to fetch OpenAPI:', res.status, await res.text())
  process.exit(1)
}
const json = await res.json()
fs.writeFileSync('supabase/openapi.json', JSON.stringify(json, null, 2))
console.log('Wrote supabase/openapi.json')
