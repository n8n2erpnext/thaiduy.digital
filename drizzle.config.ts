import { defineConfig } from 'drizzle-kit'

const user = encodeURIComponent(process.env.POSTGRES_USER ?? '')
const password = encodeURIComponent(process.env.POSTGRES_PASSWORD ?? '')
const host = process.env.POSTGRES_HOST ?? '127.0.0.1'
const port = process.env.POSTGRES_PORT ?? '55433'
const database = process.env.POSTGRES_DB ?? 'thaiduy_web'
const url = process.env.DATABASE_URL ?? `postgresql://${user}:${password}@${host}:${port}/${database}`

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/schema.ts', './src/db/auth-schema.ts'],
  out: './drizzle',
  dbCredentials: { url },
  strict: true,
  verbose: true,
})
