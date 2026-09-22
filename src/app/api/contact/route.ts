import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db/client'
import { contactMessages } from '@/db/schema'
import { createContactChallenge, verifyContactChallenge } from '@/server/contact/challenge'

const WINDOW_MS=60*60*1000
const MAX_REQUESTS=5

type Bucket={ count:number; resetAt:number }
const globalRate=globalThis as typeof globalThis & { __tdContactRate?:Map<string,Bucket> }
const buckets=globalRate.__tdContactRate ?? new Map<string,Bucket>()
globalRate.__tdContactRate=buckets

const contactSchema=z.object({
  name:z.string().trim().min(2).max(160),
  email:z.string().trim().email().max(320),
  phone:z.string().trim().max(80).optional().or(z.literal('')),
  message:z.string().trim().min(10).max(5000),
  locale:z.enum(['en','vi']).default('en'),
  company:z.string().max(0).optional().or(z.literal('')),
  challengeToken:z.string().min(16).max(512),
  mathAnswer:z.coerce.number().int().min(0).max(200),
})

function clientKey(request:Request) {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
}

function allowRequest(key:string) {

  const now=Date.now()
  const current=buckets.get(key)
  if (!current || current.resetAt<=now) {
    buckets.set(key,{count:1,resetAt:now+WINDOW_MS})
    return { ok:true, remaining:MAX_REQUESTS-1, resetAt:now+WINDOW_MS }
  }
  if (current.count>=MAX_REQUESTS) return { ok:false, remaining:0, resetAt:current.resetAt }
  current.count+=1
  buckets.set(key,current)
  return { ok:true, remaining:MAX_REQUESTS-current.count, resetAt:current.resetAt }
}

async function notifyDiscord(data:{name:string;email:string;phone?:string;message:string;locale:string}) {
  const webhookUrl=process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return false

  const fields=[
    {name:'Name',value:data.name,inline:true},
    {name:'Email',value:data.email,inline:true},
    ...(data.phone?[{name:'Phone',value:data.phone,inline:true}]:[]),
    {name:'Locale',value:data.locale.toUpperCase(),inline:true},
    {name:'Source',value:'thaiduy.digital/about',inline:true},
  ]

  const response=await fetch(webhookUrl,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      username:'Contact Bot',
      avatar_url:'https://thaiduy.digital/icon.svg',
      embeds:[{
        title:'New contact · thaiduy.digital',
        url:'https://thaiduy.digital/about',
        description:data.message.slice(0,3900),
        color:6609519,
        fields,
        timestamp:new Date().toISOString(),
      }],
    }),
    signal:AbortSignal.timeout(4000),
  }).catch(()=>null)

  return Boolean(response?.ok)
}

export async function GET() {
  const challenge=createContactChallenge()
  if (!challenge) {
    return NextResponse.json({ok:false,code:'challenge_unavailable'},{status:503})
  }
  return NextResponse.json({
    ok:true,
    challenge,
  },{
    headers:{'Cache-Control':'no-store'},
  })
}

export async function POST(request:Request) {
  const rate=allowRequest(clientKey(request))
  if (!rate.ok) {
    return NextResponse.json({ok:false,code:'rate_limited'},{status:429})
  }

  const parsed=contactSchema.safeParse(await request.json().catch(()=>null))
  if (!parsed.success) {
    return NextResponse.json({ok:false,code:'invalid_payload'},{status:400})
  }

  const data=parsed.data
  if (!verifyContactChallenge(data.challengeToken,data.mathAnswer)) {
    return NextResponse.json({ok:false,code:'math_invalid'},{status:400})
  }

  const [saved]=await db.insert(contactMessages).values({
    name:data.name,
    email:data.email,
    phone:data.phone || null,
    message:data.message,
    locale:data.locale,
    sourcePath:'/about',
  }).returning({id:contactMessages.id,createdAt:contactMessages.createdAt})

  const discordSent=await notifyDiscord({
    name:data.name,
    email:data.email,
    phone:data.phone || undefined,
    message:data.message,
    locale:data.locale,
  })
  if (discordSent) {
    console.info('[contact] Discord notification sent',{id:saved.id})
  } else {
    console.warn('[contact] Discord notification unavailable',{id:saved.id})
  }

  return NextResponse.json({
    ok:true,
    id:saved.id,
    receivedAt:saved.createdAt.toISOString(),
  },{status:201})
}

