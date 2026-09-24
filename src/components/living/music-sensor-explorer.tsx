'use client'

import { HummingPlayer, HummingScore } from '@/components/living/humming-player'
import { useEffect,useMemo,useRef,useState } from 'react'
import { useMusicState } from '@/hooks/use-music-state'
import { resolveLiveDspVisualTheme } from '@/lib/music-live-dsp-wave'
import type { MusicTheme } from '@/lib/music-expression'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type Props = {
  locale: Locale
  concepts: number
  relations: number
  semanticNodes: number
  knowledgeVersion: string
}

const layers = ['bass','lowMid','mid','vocal','presence','air'] as const
type MeterLayer=typeof layers[number]
type MeterValues=Record<MeterLayer,number>

const emptyMeter=():MeterValues=>({bass:0,lowMid:0,mid:0,vocal:0,presence:0,air:0})

function compressLiveMeter(value:number) {
  const v=Math.max(0,Math.min(1,value))
  if(v<=.68) return v
  return Math.min(.98,.68+(1-Math.exp(-(v-.68)*5))*.30)
}

function readTheme():MusicTheme {
  if(typeof document==='undefined') return 'dark'
  return document.documentElement.dataset.theme==='normal'?'normal':'dark'
}

function valueOrDash(value:string|null|undefined) {
  return value?.trim() || '—'
}

export function MusicSensorExplorer({ locale, concepts, relations, semanticNodes, knowledgeVersion }:Props) {
  const state=useMusicState()
  const [theme,setTheme]=useState<MusicTheme>('dark')
  const [meterValues,setMeterValues]=useState<MeterValues>(emptyMeter)
  const [meterPeaks,setMeterPeaks]=useState<MeterValues>(emptyMeter)
  const meterTargetRef=useRef<MeterValues>(emptyMeter())
  const meterValueRef=useRef<MeterValues>(emptyMeter())
  const meterPeakRef=useRef<MeterValues>(emptyMeter())
  const meterHoldRef=useRef<Record<MeterLayer,number>>({bass:0,lowMid:0,mid:0,vocal:0,presence:0,air:0})
  const t=messages[locale].music
  const e=t.explorer
  const vi=locale==='vi'
  const liveVisualTheme=useMemo(
    ()=>resolveLiveDspVisualTheme(theme,state.layers),
    [theme,state.layers],
  )
  const track=state.track
    ? state.track.title+' — '+state.track.artist
    : state.signal==='dsp'
      ? (vi?'Live DSP · chưa có metadata từ Android':'Live DSP · track metadata pending')
      : (vi?'Không có bài đang phát':'No active playback')
  const modeLabel=vi
    ? (state.mode==='listening'?'ĐANG NGHE':state.mode==='humming'?'ĐANG NGÂN NGA':'ĐANG NGHỈ')
    : state.mode.toUpperCase()
  const signalLabel=vi
    ? (state.signal==='offline'?'OFFLINE':state.signal==='dsp'?'DSP LIVE':'NGỮ NGHĨA')
    : state.signal.toUpperCase()

  useEffect(()=>{
    const sync=()=>setTheme(readTheme())
    sync()
    const observer=new MutationObserver(sync)
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
    return()=>observer.disconnect()
  },[])

  useEffect(()=>{
    if(state.signal!=='dsp') {
      const direct=Object.fromEntries(layers.map(layer=>[layer,state.layers[layer].weight])) as MeterValues
      meterTargetRef.current=direct
      meterValueRef.current=direct
      meterPeakRef.current=direct
      setMeterValues(direct)
      setMeterPeaks(direct)
      return
    }
    meterTargetRef.current=Object.fromEntries(
      layers.map(layer=>[layer,compressLiveMeter(state.layers[layer].weight)]),
    ) as MeterValues
  },[state.layers,state.signal])

  useEffect(()=>{
    if(state.signal!=='dsp') return
    let frame=0
    let previous=performance.now()
    const tick=(now:number)=>{
      const dt=Math.min(.05,Math.max(.001,(now-previous)/1000))
      previous=now
      let changed=false
      const next={...meterValueRef.current}
      const peaks={...meterPeakRef.current}

      for(const layer of layers) {
        const target=meterTargetRef.current[layer]
        const current=next[layer]
        const tau=target>current?.12:.52
        const alpha=1-Math.exp(-dt/tau)
        next[layer]=current+(target-current)*alpha

        if(target>=peaks[layer]) {
          peaks[layer]=target
          meterHoldRef.current[layer]=now+160
        } else if(now>meterHoldRef.current[layer]) {
          const peakAlpha=1-Math.exp(-dt/.78)
          peaks[layer]=Math.max(next[layer],peaks[layer]+(next[layer]-peaks[layer])*peakAlpha)
        }
        if(Math.abs(next[layer]-meterValueRef.current[layer])>.0005||Math.abs(peaks[layer]-meterPeakRef.current[layer])>.0005) changed=true
      }

      meterValueRef.current=next
      meterPeakRef.current=peaks
      if(changed) {
        setMeterValues(next)
        setMeterPeaks(peaks)
      }
      frame=requestAnimationFrame(tick)
    }
    frame=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(frame)
  },[state.signal])

  const displayValue=(value:string|null|undefined) => {
    const base=valueOrDash(value)
    if (!vi) return base
    if (base==='unknown') return 'chưa rõ'
    if (base==='unresolved') return 'chưa xác định'
    if (base==='resting') return 'đang nghỉ'
    if (base==='listening') return 'đang nghe'
    if (base==='humming') return 'đang ngân nga'
    if (base==='offline') return 'offline'
    return base
  }
  const stages=[
    {
      key:'semantic',
      title:e.semantic,
      state:state.signal==='dsp' ? (vi?'DỰ PHÒNG':'STANDBY') : state.signal==='offline' ? (vi?'ĐANG CHỜ':'WAITING') : (vi?'ĐANG HOẠT ĐỘNG':'ACTIVE'),
      copy:vi
        ? 'Chỉ làm chủ khi DSP mất tín hiệu đủ lâu. Khi DSP đang sống, LastFM và semantic memory không tham gia quyết định âm học.'
        : 'Owns analysis only after DSP is truly lost. While DSP is authoritative, LastFM and semantic memory do not vote in the acoustic decision.',
      facts:[['genre',displayValue(state.genre)],['style',displayValue(state.style)]],
    },
    {
      key:'acoustic',
      title:e.acoustic,
      state:state.signal==='dsp' ? 'LIVE DSP' : (vi?'CHỈ DÙNG NGỮ NGHĨA':'SEMANTIC ONLY'),
      copy:vi
        ? 'DSP V2 đo phổ, onset, tempo, beat, meter, swing, harmonic/percussive và dynamic range; classifier chỉ phát nhãn khi vượt ngưỡng tin cậy.'
        : 'DSP V2 measures spectrum, onset, tempo, beat, meter, swing, harmonic/percussive balance and dynamic range; classifiers emit labels only above confidence thresholds.',
      facts:[
        [vi?'dải nổi bật':'dominant',displayValue(state.dominantLayer)],
        [vi?'nhạc cụ':'instrument',displayValue(state.instrumentFamily)],
        ['tempo',state.tempoBpm&&state.tempoBpm>0?String(Math.round(state.tempoBpm))+' BPM':'—'],
      ],
    },
    {
      key:'cortex',
      title:e.cortex,
      state:vi?'ĐƯỢC QUẢN TRỊ':'GOVERNED',
      copy:vi
        ? 'Arbiter chọn đúng một chủ nguồn: DSP HOT/GRACE hoặc semantic fallback. Không pha trộn hai nguồn trong cùng một quyết định.'
        : 'The arbiter selects exactly one authority: DSP HOT/GRACE or semantic fallback. The two sources are never blended into one decision.',
      facts:[[vi?'tâm trạng':'mood',displayValue(state.mood)],[vi?'chất âm':'texture',displayValue(state.texture)]],
    },
    {
      key:'afterglow',
      title:e.afterglow,
      state:state.mode==='humming' ? (vi?'ĐANG SÁNG TÁC':'COMPOSING') : (vi?'KÝ ỨC':'MEMORY'),
      copy:vi
        ? 'Chỉ giữ lại các đặc trưng trừu tượng như energy, meter, swing, mode-family và thói quen sáng tác; không lưu giai điệu đã nghe.'
        : 'Keeps only abstract residue such as energy, meter, swing, mode-family and composing habits; heard melodies are not retained.',
      facts:[[vi?'trạng thái':'mode',displayValue(state.mode)],[vi?'độ tin cậy':'confidence',String(Math.round(state.confidence*100))+'%']],
    },
  ]
  return (
    <main className="music-lab-page">
      <section className="music-lab-hero">
        <p className="eyebrow">{e.eyebrow}</p>
        <div className="music-lab-hero-grid">
          <div>
            <h1>{e.pageTitle}</h1>
            <p>{e.lede}</p>
          </div>
          <div className="music-live-badge">
            <span>{modeLabel} · {signalLabel}</span>
            <strong>{track}</strong>
          </div>
        </div>
      </section>

      <section className="music-lab-section">
        <div className="music-lab-section-head">
          <span>{e.live}</span>
          <strong>{Math.round(state.confidence*100)}% {vi?'ĐỘ TIN CẬY':'CONFIDENCE'}</strong>
        </div>
        <div className="music-live-grid">
          <div className="music-live-primary">
            <span>{vi?'BÀI HIỆN TẠI':'CURRENT TRACK'}</span>
            <h2>{track}</h2>
            <div className="music-live-tags">
              {[state.genre,state.style,state.arrangement,state.texture,state.mood].filter(Boolean).map(item=><span key={item}>{displayValue(item)}</span>)}
            </div>
          </div>
          <div className="music-layer-meter">
            {layers.map(layer=>{
              const level=state.signal==='dsp'?meterValues[layer]:state.layers[layer].weight
              const peak=state.signal==='dsp'?meterPeaks[layer]:level
              const color=state.signal==='dsp'?liveVisualTheme.barFillColors[layer]:undefined
              const climax=state.signal==='dsp'?Math.max(0,Math.min(1,(level-.87)/.13)):0
              return (
                <div key={layer}>
                  <span>{t.layers[layer]}</span>
                  <i style={state.signal==='dsp'?{background:liveVisualTheme.barTrackColor}:undefined}>
                    <b style={{
                      width:String(Math.round(level*100))+'%',
                      background:color,
                      boxShadow:climax>0
                        ? '0 0 '+String(7+climax*11)+'px '+color+'aa'
                        : state.signal==='dsp'&&theme==='normal'?'0 0 7px '+color+'55':undefined,
                      filter:climax>0?'saturate('+String(1.08+climax*.25)+') brightness('+String(1+climax*.10)+')':undefined,
                    }} />
                    {state.signal==='dsp'&&<small style={{
                      left:'calc('+String(Math.round(peak*100))+'% - 1px)',
                      background:color,
                      boxShadow:climax>0
                        ? '0 0 '+String(7+climax*9)+'px '+color+'cc'
                        : '0 0 6px '+color+'66',
                    }} />}
                  </i>
                  <em>{Math.round(level*100)}</em>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <section className="music-lab-section">
        <div className="music-lab-section-head"><span>{e.pipeline}</span><strong>{vi?'NGỮ NGHĨA → ÂM HỌC → CORTEX → KÝ ỨC':'LEFT → RIGHT → CORTEX → MEMORY'}</strong></div>
        <div className="music-pipeline-grid">
          {stages.map((stage,index)=>(
            <article className="music-pipeline-card" key={stage.key}>
              <div className="music-pipeline-index">0{index+1}</div>
              <div className="music-pipeline-title"><h3>{stage.title}</h3><span>{stage.state}</span></div>
              <p>{stage.copy}</p>
              <div className="music-pipeline-facts">
                {stage.facts.map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="music-lab-section music-knowledge-section">
        <div className="music-lab-section-head"><span>{e.knowledge}</span><strong>{knowledgeVersion.toUpperCase()}</strong></div>
        <div className="music-knowledge-grid">
          <div><strong>{concepts.toLocaleString()}</strong><span>{vi?'khái niệm âm nhạc':'music concepts'}</span></div>
          <div><strong>{relations.toLocaleString()}</strong><span>{vi?'quan hệ trong knowledge graph':'knowledge relations'}</span></div>
          <div><strong>{semanticNodes.toLocaleString()}</strong><span>{vi?'node ngữ nghĩa genre/style':'semantic genre/style nodes'}</span></div>
          <div><strong>11</strong><span>{vi?'miền tri thức':'knowledge domains'}</span></div>
        </div>
        <p className="music-knowledge-note">{vi
          ? 'Nhạc lý, rhythm, form, nhạc cụ, vocal, production, psychoacoustics, lịch sử, recording identity, âm nhạc vùng miền và genre/style cùng nằm trong một knowledge graph có cấu trúc.'
          : 'Theory, rhythm, form, instruments, vocal, production, psychoacoustics, history, recording identity, world/regional music and genre/style live in one structured graph.'}</p>
      </section>
      <section className="music-lab-section">
        <div className="music-lab-section-head"><span>{e.composition}</span><strong>{state.composition?(vi?'BẢN NHẠC LIVE':'LIVE SCORE'):(vi?'ĐANG NGHỈ':'IDLE')}</strong></div>
        <div className="music-composer-public">
          {state.composition ? (
            <>
              <div className="music-composer-copy">
                <span>{state.composition.title}</span>
                <h2>{state.composition.key} {state.composition.mode.toUpperCase()}</h2>
                <p>
                  {state.composition.bpm} BPM · {state.composition.meter} · {state.composition.bars} {vi?'Ô NHỊP':'BARS'}
                  {' · '}{(state.composition.instrument ?? state.composition.voice).replaceAll('-',' ').toUpperCase()}
                  {' · '}{state.composition.ensemble?.layers ?? 2} {vi?'LỚP':'LAYERS'}
                </p>
                <p>{state.composition.chordProgression.join(' → ')}</p>
              </div>
              <div className="music-composer-sketch">
                <div className="music-composer-sketch-head">
                  <span>{vi?'BẢN PHÁC HIỆN TẠI':'CURRENT SKETCH'}</span>
                  <HummingPlayer composition={state.composition} locale={locale} showPanel={false}/>
                </div>
                <HummingScore composition={state.composition}/>
                <div className="music-composer-sketch-meta">
                  <span>{vi?'câu hỏi':'question'} → {vi?'trả lời':'answer'}</span>
                  <span>{state.composition.notes.length} {vi?'NỐT':'NOTES'} · {state.composition.chordProgression.join(' / ')}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="music-composer-idle">
              <span>{vi?'BỘ SÁNG TÁC ĐANG NGHỈ':'COMPOSER RESTING'}</span>
              <p>{e.noComposition}</p>
            </div>
          )}
        </div>
        <div className="music-memory-rule"><span>{vi?'TÍNH NGUYÊN BẢN / RANH GIỚI KÝ ỨC':'ORIGINALITY / MEMORY BOUNDARY'}</span><p>{e.privacy}</p></div>
      </section>
    </main>
  )
}
