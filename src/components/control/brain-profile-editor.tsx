'use client'

import { useMemo, useState } from 'react'
import { saveBrainAction } from '@/app/control/(protected)/brains/actions'

type JsonObject=Record<string,unknown>

type MemoryStat={
  hemisphere:string
  entries:number
  lastLearned:string | null
}

type Props={
  brainKey:string
  enabled:boolean
  leftConfig:JsonObject
  rightConfig:JsonObject
  cortexConfig:JsonObject
  memoryConfig:JsonObject
  stats:MemoryStat[]
}

function stringValue(value:unknown,fallback='') {
  return typeof value==='string'?value:fallback
}

function numberValue(value:unknown,fallback=0) {
  return typeof value==='number' && Number.isFinite(value)?value:fallback
}

function listValue(value:unknown) {
  return Array.isArray(value)?value.map(String):[]
}

function splitList(value:string) {
  return value.split(',').map(item=>item.trim()).filter(Boolean)
}

function pretty(value:JsonObject) {
  return JSON.stringify(value,null,2)
}

function learnedLabel(value:string | null) {
  if (!value) return 'NO LEARNING TIMESTAMP'
  const date=new Date(value)
  if (Number.isNaN(date.getTime())) return 'UNKNOWN'
  return new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Ho_Chi_Minh',
    day:'2-digit',
    month:'short',
    year:'numeric',
    hour:'2-digit',
    minute:'2-digit',
    hour12:false,
  }).format(date)
}

export function BrainProfileEditor({
  brainKey,
  enabled,
  leftConfig:initialLeft,
  rightConfig:initialRight,
  cortexConfig:initialCortex,
  memoryConfig:initialMemory,
  stats,
}:Props) {
  const [left,setLeft]=useState(initialLeft)
  const [right,setRight]=useState(initialRight)
  const [cortex,setCortex]=useState(initialCortex)
  const [memory,setMemory]=useState(initialMemory)
  const [raw,setRaw]=useState({
    left:pretty(initialLeft),
    right:pretty(initialRight),
    cortex:pretty(initialCortex),
    memory:pretty(initialMemory),
  })
  const [rawStatus,setRawStatus]=useState<'idle'|'applied'|'error'>('idle')

  function sync<T extends 'left'|'right'|'cortex'|'memory'>(
    key:T,
    next:JsonObject,
    setter:(value:JsonObject)=>void,
  ) {
    setter(next)
    setRaw(current=>({...current,[key]:pretty(next)}))
    setRawStatus('idle')
  }

  function applyRaw() {
    try {
      const next={
        left:JSON.parse(raw.left) as JsonObject,
        right:JSON.parse(raw.right) as JsonObject,
        cortex:JSON.parse(raw.cortex) as JsonObject,
        memory:JSON.parse(raw.memory) as JsonObject,
      }
      if (Object.values(next).some(value=>!value || Array.isArray(value) || typeof value!=='object')) throw new Error('invalid')
      setLeft(next.left)
      setRight(next.right)
      setCortex(next.cortex)
      setMemory(next.memory)
      setRaw({
        left:pretty(next.left),
        right:pretty(next.right),
        cortex:pretty(next.cortex),
        memory:pretty(next.memory),
      })
      setRawStatus('applied')
    } catch {
      setRawStatus('error')
    }
  }

  const memorySummary=useMemo(()=>{
    const runtime=stats.filter(row=>['left','right','cortex'].includes(row.hemisphere))
    const knowledge=stats.filter(row=>row.hemisphere.startsWith('knowledge-'))
      .sort((a,b)=>b.entries-a.entries)
    const total=stats.reduce((sum,row)=>sum+row.entries,0)
    const knowledgeTotal=knowledge.reduce((sum,row)=>sum+row.entries,0)
    const latest=stats
      .map(row=>row.lastLearned)
      .filter((value):value is string=>Boolean(value))
      .sort((a,b)=>new Date(b).getTime()-new Date(a).getTime())[0] ?? null
    return {runtime,knowledge,total,knowledgeTotal,latest}
  },[stats])

  const leftMax=Math.max(1,numberValue(memory.leftMax,4096))
  const rightMax=Math.max(1,numberValue(memory.rightMax,4096))
  const cortexMax=Math.max(1,numberValue(memory.cortexMax,2048))

  const memoryCards=[
    ['LEFT','Semantic memory','left',leftMax],
    ['RIGHT','Signal memory','right',rightMax],
    ['CORTEX','Fusion memory','cortex',cortexMax],
  ] as const

  return (
    <form className="brain-console" action={saveBrainAction}>
      <input type="hidden" name="brainKey" value={brainKey}/>
      <input type="hidden" name="leftConfig" value={JSON.stringify(left)}/>
      <input type="hidden" name="rightConfig" value={JSON.stringify(right)}/>
      <input type="hidden" name="cortexConfig" value={JSON.stringify(cortex)}/>
      <input type="hidden" name="memoryConfig" value={JSON.stringify(memory)}/>

      <header className="brain-console-head">
        <div>
          <span>BRAIN PROFILE</span>
          <h2>{brainKey}</h2>
          <p>{memorySummary.total.toLocaleString('en-US')} memory entries · last learned {learnedLabel(memorySummary.latest)}</p>
        </div>
        <label className="control-toggle brain-enabled">
          <input name="enabled" type="checkbox" defaultChecked={enabled}/>
          <span>ENABLED</span>
        </label>
      </header>

      <section className="brain-architecture">
        <header className="brain-section-head">
          <div><span>ARCHITECTURE</span><h3>Three bounded responsibilities</h3></div>
          <em>LEFT → RIGHT → CORTEX</em>
        </header>

        <div className="brain-role-grid">
          <article>
            <div className="brain-role-title">
              <span>01 / LEFT</span>
              <strong>Semantic</strong>
            </div>
            <label>
              <span>ROLE</span>
              <input
                value={stringValue(left.role)}
                onChange={event=>sync('left',{...left,role:event.target.value},setLeft)}
              />
            </label>
            <label>
              <span>SOURCES · COMMA SEPARATED</span>
              <input
                value={listValue(left.sources).join(', ')}
                onChange={event=>sync('left',{...left,sources:splitList(event.target.value)},setLeft)}
              />
            </label>
            <label>
              <span>KNOWLEDGE VERSION</span>
              <input
                value={stringValue(left.knowledgeVersion)}
                onChange={event=>sync('left',{...left,knowledgeVersion:event.target.value},setLeft)}
              />
            </label>
          </article>

          <article>
            <div className="brain-role-title">
              <span>02 / RIGHT</span>
              <strong>Signal</strong>
            </div>
            <label>
              <span>ROLE</span>
              <input
                value={stringValue(right.role)}
                onChange={event=>sync('right',{...right,role:event.target.value},setRight)}
              />
            </label>
            <label>
              <span>BANDS · COMMA SEPARATED</span>
              <input
                value={listValue(right.bands).join(', ')}
                onChange={event=>sync('right',{...right,bands:splitList(event.target.value)},setRight)}
              />
            </label>
            <label>
              <span>SOURCES · COMMA SEPARATED</span>
              <input
                value={listValue(right.sources).join(', ')}
                onChange={event=>sync('right',{...right,sources:splitList(event.target.value)},setRight)}
              />
            </label>
            <label>
              <span>KNOWLEDGE VERSION</span>
              <input
                value={stringValue(right.knowledgeVersion)}
                onChange={event=>sync('right',{...right,knowledgeVersion:event.target.value},setRight)}
              />
            </label>
          </article>

          <article>
            <div className="brain-role-title">
              <span>03 / CORTEX</span>
              <strong>Fusion</strong>
            </div>
            <label>
              <span>ROLE</span>
              <input
                value={stringValue(cortex.role)}
                onChange={event=>sync('cortex',{...cortex,role:event.target.value},setCortex)}
              />
            </label>
            <div className="brain-inline-fields">
              <label>
                <span>CROSSFADE · MS</span>
                <input
                  min={0}
                  type="number"
                  value={numberValue(cortex.crossfadeMs)}
                  onChange={event=>sync('cortex',{...cortex,crossfadeMs:Number(event.target.value)},setCortex)}
                />
              </label>
              <label>
                <span>HYSTERESIS · MS</span>
                <input
                  min={0}
                  type="number"
                  value={numberValue(cortex.hysteresisMs)}
                  onChange={event=>sync('cortex',{...cortex,hysteresisMs:Number(event.target.value)},setCortex)}
                />
              </label>
            </div>
            <label>
              <span>KNOWLEDGE VERSION</span>
              <input
                value={stringValue(cortex.knowledgeVersion)}
                onChange={event=>sync('cortex',{...cortex,knowledgeVersion:event.target.value},setCortex)}
              />
            </label>
          </article>
        </div>
      </section>

      <section className="brain-memory">
        <header className="brain-section-head">
          <div><span>MEMORY POLICY</span><h3>Capacity and observed state</h3></div>
          <em>{memorySummary.knowledgeTotal.toLocaleString('en-US')} KNOWLEDGE ENTRIES</em>
        </header>

        <div className="brain-memory-capacity">
          {memoryCards.map(([label,title,key,max])=>{
            const entries=memorySummary.runtime.find(row=>row.hemisphere===key)?.entries ?? 0
            const ratio=Math.min(100,Math.max(0,entries/max*100))
            const configKey=key==='left'?'leftMax':key==='right'?'rightMax':'cortexMax'
            return (
              <article key={key}>
                <div><span>{label}</span><strong>{title}</strong></div>
                <p><b>{entries.toLocaleString('en-US')}</b> / {max.toLocaleString('en-US')} entries</p>
                <div className="brain-memory-meter"><i style={{width:`${ratio}%`}}/></div>
                <label>
                  <span>CAPACITY</span>
                  <input
                    min={1}
                    type="number"
                    value={numberValue(memory[configKey],max)}
                    onChange={event=>sync('memory',{...memory,[configKey]:Number(event.target.value)},setMemory)}
                  />
                </label>
              </article>
            )
          })}
        </div>

        <div className="brain-memory-state">
          <div className="brain-memory-overview">
            <span>MEMORY STATE</span>
            <strong>{memorySummary.total.toLocaleString('en-US')}</strong>
            <p>Total persisted entries across runtime memory and knowledge packs.</p>
            <small>LAST LEARNED · {learnedLabel(memorySummary.latest)}</small>
          </div>
          <div className="brain-knowledge-groups">
            <header>
              <span>KNOWLEDGE PACKS</span>
              <strong>{memorySummary.knowledge.length} GROUPS</strong>
            </header>
            {memorySummary.knowledge.map(row=>(
              <div key={row.hemisphere}>
                <span>{row.hemisphere.replace('knowledge-','')}</span>
                <strong>{row.entries.toLocaleString('en-US')}</strong>
                <small>{learnedLabel(row.lastLearned)}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <details className="brain-advanced">
        <summary>
          <span>ADVANCED / RAW CONFIG</span>
          <em>Direct JSON escape hatch</em>
        </summary>
        <p>Structured controls above remain the default. Edit raw JSON here only when a field is not represented in the semantic editor, then apply it before saving.</p>
        <div className="brain-raw-grid">
          <label><span>LEFT JSON</span><textarea value={raw.left} onChange={event=>setRaw(current=>({...current,left:event.target.value}))} spellCheck={false}/></label>
          <label><span>RIGHT JSON</span><textarea value={raw.right} onChange={event=>setRaw(current=>({...current,right:event.target.value}))} spellCheck={false}/></label>
          <label><span>CORTEX JSON</span><textarea value={raw.cortex} onChange={event=>setRaw(current=>({...current,cortex:event.target.value}))} spellCheck={false}/></label>
          <label><span>MEMORY JSON</span><textarea value={raw.memory} onChange={event=>setRaw(current=>({...current,memory:event.target.value}))} spellCheck={false}/></label>
        </div>
        <div className="brain-raw-actions">
          <button type="button" onClick={applyRaw}>APPLY RAW JSON</button>
          {rawStatus==='applied' && <span data-state="ok">RAW JSON APPLIED</span>}
          {rawStatus==='error' && <span data-state="error">INVALID JSON · NOTHING APPLIED</span>}
        </div>
      </details>

      <footer className="brain-console-footer">
        <div>
          <span>BOUNDED MEMORY / EVIDENCE FUSION</span>
          <small>Structured fields write the same profile JSON used by the runtime.</small>
        </div>
        <button className="control-primary-button" type="submit">SAVE BRAIN PROFILE</button>
      </footer>
    </form>
  )
}
