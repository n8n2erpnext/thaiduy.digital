import Redis from 'ioredis'

function redisOptions() {
  const host = process.env.REDIS_HOST ?? '127.0.0.1'
  const port = Number(process.env.REDIS_PORT ?? 56380)
  const password = process.env.REDIS_PASSWORD
  if (!password) throw new Error('Redis password is not configured')
  return { host, port, password, db: 0, lazyConnect: true, maxRetriesPerRequest: 2 }
}

const globalRedis = globalThis as typeof globalThis & { __tdRedis?: Redis }

export const redis = globalRedis.__tdRedis ?? new Redis(redisOptions())

if (process.env.NODE_ENV !== 'production') globalRedis.__tdRedis = redis

export async function ensureRedis() {
  if (redis.status === 'wait') await redis.connect()
  return redis
}
