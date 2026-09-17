import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

function connectionUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const user = encodeURIComponent(process.env.POSTGRES_USER ?? '')
  const password = encodeURIComponent(process.env.POSTGRES_PASSWORD ?? '')
  const host = process.env.POSTGRES_HOST ?? '127.0.0.1'
  const port = process.env.POSTGRES_PORT ?? '55433'
  const database = process.env.POSTGRES_DB ?? 'thaiduy_web'

  if (!user || !password) throw new Error('Postgres credentials are not configured')
  return `postgresql://${user}:${password}@${host}:${port}/${database}`
}

export const sqlClient = postgres(connectionUrl(), {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
})

export const db = drizzle(sqlClient)
