import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@/db/client'
import * as authSchema from '@/db/auth-schema'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (candidate, context) => {
          const ownerEmail = process.env.CONTROL_OWNER_EMAIL?.trim().toLowerCase()
          const email = candidate.email.toLowerCase()

          if (context?.path === '/callback/:id' && context.params?.id === 'google') {
            return
          }

          if (!ownerEmail || email !== ownerEmail) return false
          const existing = await db.select({ id: authSchema.user.id }).from(authSchema.user).limit(1)
          if (existing.length > 0) return false
        },
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      requireLocalEmailVerified: false,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  trustedOrigins: [
    'https://thaiduy.digital',
    'http://localhost:3000',
  ],
})
