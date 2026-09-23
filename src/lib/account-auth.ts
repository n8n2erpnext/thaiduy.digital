import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export async function getAccountSession() {
  return auth.api.getSession({headers:await headers()})
}

export async function requireAccountSession() {
  const session=await getAccountSession()
  if (!session?.user) redirect('/discuss')
  return session
}
