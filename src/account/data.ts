import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { account,user } from '@/db/auth-schema'

export async function getAccountOverview(userId:string) {
  const [profile]=await db.select({
    id:user.id,
    name:user.name,
    email:user.email,
    image:user.image,
    emailVerified:user.emailVerified,
    createdAt:user.createdAt,
    updatedAt:user.updatedAt,
  }).from(user).where(eq(user.id,userId)).limit(1)
  if (!profile) return null

  const providers=await db.select({
    providerId:account.providerId,
    createdAt:account.createdAt,
  }).from(account).where(eq(account.userId,userId))

  return {
    ...profile,
    providers,
  }
}
