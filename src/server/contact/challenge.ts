import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

const CHALLENGE_TTL_MS=10*60*1000

export type ContactChallenge={
  a:number
  b:number
  token:string
  expiresAt:number
}

function challengeSecret() {
  return process.env.CONTACT_FORM_SECRET ?? process.env.BETTER_AUTH_SECRET ?? ''
}

function sign(payload:string) {
  return createHmac('sha256',challengeSecret()).update(payload).digest('base64url')
}

export function createContactChallenge():ContactChallenge|null {
  if (!challengeSecret()) return null
  const a=Math.floor(Math.random()*18)+4
  const b=Math.floor(Math.random()*17)+3
  const expiresAt=Date.now()+CHALLENGE_TTL_MS
  const payload=`${a}.${b}.${expiresAt}`
  return {
    a,
    b,
    expiresAt,
    token:`${payload}.${sign(payload)}`,
  }
}

export function verifyContactChallenge(token:string,answer:number) {
  if (!challengeSecret()) return false
  const parts=token.split('.')
  if (parts.length!==4) return false

  const [aRaw,bRaw,expiresRaw,signature]=parts
  const a=Number(aRaw)
  const b=Number(bRaw)
  const expiresAt=Number(expiresRaw)

  if (![a,b,expiresAt].every(Number.isFinite)) return false
  if (expiresAt<Date.now()) return false

  const payload=`${aRaw}.${bRaw}.${expiresRaw}`
  const expected=sign(payload)
  const left=Buffer.from(signature)
  const right=Buffer.from(expected)

  if (left.length!==right.length) return false
  if (!timingSafeEqual(left,right)) return false

  return answer===a+b
}
