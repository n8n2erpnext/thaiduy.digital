import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { HummingComposition } from '@/lib/music-state'

type StoredSketch = {
  version: 1
  number: number
  savedAt: string
  composition: HummingComposition
}

type SketchbookIndex = {
  version: 2
  month: string
  timezone: 'Asia/Ho_Chi_Minh'
  createdAt: string
  updatedAt: string
  count: number
  nextNumber: number
}

const TIMEZONE='Asia/Ho_Chi_Minh'
const STORE_DIR='/home/ubuntu/.local/share/thaiduy.digital/music-sensor/sketchbook'
let writeQueue=Promise.resolve()

function localMonth(timestamp:number) {
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:TIMEZONE,year:'numeric',month:'2-digit',
  }).formatToParts(new Date(timestamp))
  const year=parts.find(part=>part.type==='year')?.value ?? '1970'
  const month=parts.find(part=>part.type==='month')?.value ?? '01'
  return year+'-'+month
}

function monthDir(month:string) {
  return path.join(STORE_DIR,month)
}

function indexFile(month:string) {
  return path.join(monthDir(month),'index.json')
}

function safeId(id:string) {
  return id.replace(/[^a-zA-Z0-9_-]/g,'_')
}

function sketchFile(month:string,id:string) {
  return path.join(monthDir(month),safeId(id)+'.json')
}

async function atomicWrite(target:string,payload:unknown) {
  const temporary=target+'.tmp-'+process.pid
  await writeFile(temporary,JSON.stringify(payload,null,2)+'\n','utf8')
  await rename(temporary,target)
}

async function rollMonth(currentMonth:string) {
  await mkdir(STORE_DIR,{recursive:true})
  const marker=path.join(STORE_DIR,'current-month')
  let previousMonth=''
  try { previousMonth=(await readFile(marker,'utf8')).trim() } catch { previousMonth='' }

  if (/^\d{4}-\d{2}$/.test(previousMonth) && previousMonth!==currentMonth) {
    await rm(monthDir(previousMonth),{recursive:true,force:true})
  }

  await mkdir(monthDir(currentMonth),{recursive:true})
  if (previousMonth!==currentMonth) await writeFile(marker,currentMonth+'\n','utf8')
}

async function readIndex(month:string):Promise<SketchbookIndex|null> {
  try {
    const parsed=JSON.parse(await readFile(indexFile(month),'utf8')) as SketchbookIndex
    if (parsed.version!==2 || parsed.month!==month || !Number.isInteger(parsed.nextNumber)) return null
    return parsed
  } catch {
    return null
  }
}

async function readStoredSketch(month:string,id:string):Promise<HummingComposition|null> {
  try {
    const parsed=JSON.parse(await readFile(sketchFile(month,id),'utf8')) as StoredSketch
    if (parsed.version!==1 || parsed.composition?.id!==id) return null
    return parsed.composition
  } catch {
    return null
  }
}

async function persistInternal(composition:HummingComposition):Promise<HummingComposition> {
  const month=localMonth(composition.startedAt)
  await rollMonth(month)

  const duplicate=await readStoredSketch(month,composition.id)
  if (duplicate) return duplicate

  const now=new Date().toISOString()
  const index=await readIndex(month) ?? {
    version:2 as const,
    month,
    timezone:TIMEZONE,
    createdAt:now,
    updatedAt:now,
    count:0,
    nextNumber:1,
  }

  const number=Math.max(1,index.nextNumber)
  const stored:HummingComposition={
    ...composition,
    title:'Idle sketch '+String(number).padStart(3,'0'),
    sketchNumber:number,
    sketchbookMonth:month,
  }

  const nextIndex:SketchbookIndex={
    ...index,
    updatedAt:now,
    count:index.count+1,
    nextNumber:number+1,
  }

  // Reserve the number first. A crash may leave a harmless gap, but can never duplicate a sketch number.
  await atomicWrite(indexFile(month),nextIndex)
  await atomicWrite(sketchFile(month,composition.id),{
    version:1,
    number,
    savedAt:now,
    composition:stored,
  } satisfies StoredSketch)

  return stored
}

export function persistHummingSketch(composition:HummingComposition):Promise<HummingComposition> {
  const task=writeQueue.then(()=>persistInternal(composition),()=>persistInternal(composition))
  writeQueue=task.then(()=>undefined,()=>undefined)
  return task
}

export async function readCurrentSketchbookIndex(timestamp=Date.now()) {
  return readIndex(localMonth(timestamp))
}

export function hummingSketchbookPath(timestamp=Date.now()) {
  return monthDir(localMonth(timestamp))
}
