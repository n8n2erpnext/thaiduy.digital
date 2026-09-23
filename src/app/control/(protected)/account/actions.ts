'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { requireBetterAuthControlOwner } from '@/lib/control-auth'

function passwordFrom(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '')
  if (value.length < 12) redirect('/control/account?error=weak')
  return value
}

export async function setFallbackPassword(formData: FormData) {
  await requireBetterAuthControlOwner()
  const newPassword = passwordFrom(formData, 'newPassword')
  try {
    await auth.api.setPassword({ headers: await headers(), body: { newPassword } })
  } catch {
    redirect('/control/account?error=set')
  }
  redirect('/control/account?ok=set')
}
