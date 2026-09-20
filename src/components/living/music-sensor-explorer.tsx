'use client'

import { HummingPlayer, HummingScore } from '@/components/living/humming-player'
import { useMusicState } from '@/hooks/use-music-state'
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

function valueOrDash(value:string|null|undefined) {
  return value?.trim() || '—'
}

export function MusicSensorExplorer({ locale, concepts, relations, semanticNodes, knowledgeVersion }:Props) {
  const state=useMusicState()
  const t=messages[locale].music
  const e=t.explorer
  const vi=locale==='vi'
  const track=state.track ? state.track.title+' — '+state.track.artist : (vi?'Không có bài đang phát':'No active playback')
  const stages=[
    {
      key:'semantic',
      title:e.semantic,
      state:state.signal==='offline' ? (vi?'đang chờ':'waiting') : 'ACTIVE',
      copy:vi
        ? 'Đọc track/artist tags, context và knowledge graph; track evidence có quyền cao hơn artist prior.'
        : 'Reads track/artist tags, context and the knowledge graph; track evidence outranks artist priors.',
      facts:[['genre',valueOrDash(state.genre)],['style',valueOrDash(state.style)]],
    },
    {
      key:'acoustic',
      title:e.acoustic,
      state:state.signal==='dsp' ? 'LIVE DSP' : (vi?'SEMANTIC ONLY':'SEMANTIC ONLY'),
      copy:vi
        ? 'Phân tách bass, low-mid, mid, vocal, presence và air. Khi DSP offline, organ không giả vờ có tín hiệu âm thanh.'
        : 'Separates bass, low-mid, mid, vocal, presence and air. When DSP is offline, the organ does not fake acoustic input.',
      facts:[['dominant',state.dominantLayer],['signal',state.signal]],
    },
    {
      key:'cortex',
      title:e.cortex,
      state:'GOVERNED',
      copy:vi
        ? 'Hợp nhất semantic và acoustic evidence rồi tách riêng genre, style, arrangement, texture và mood.'
        : 'Combines semantic and acoustic evidence while keeping genre, style, arrangement, texture and mood separate.',
      facts:[['mood',valueOrDash(state.mood)],['texture',valueOrDash(state.texture)]],
    },
    {
      key:'afterglow',
      title:e.afterglow,
      state:state.mode==='humming' ? 'COMPOSING' : 'MEMORY',
      copy:vi
        ? 'Chỉ giữ dư âm trừu tượng như energy, meter, swing, mode-family và thói quen sáng tác; không giữ melody đã nghe.'
        : 'Keeps only abstract residue such as energy, meter, swing, mode-family and composing habits; heard melodies are not retained.',
      facts:[['mode',state.mode],['confidence',String(Math.round(state.confidence*100))+'%']],
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
            <span>{state.mode.toUpperCase()} · {state.signal.toUpperCase()}</span>
            <strong>{track}</strong>
          </div>
        </div>
      </section>

      <section className="music-lab-section">
        <div className="music-lab-section-head">
          <span>{e.live}</span>
          <strong>{Math.round(state.confidence*100)}% CONFIDENCE</strong>
        </div>
        <div className="music-live-grid">
          <div className="music-live-primary">
            <span>{vi?'BÀI HIỆN TẠI':'CURRENT TRACK'}</span>
            <h2>{track}</h2>
            <div className="music-live-tags">
              {[state.genre,state.style,state.arrangement,state.texture,state.mood].filter(Boolean).map(item=><span key={item}>{item}</span>)}
            </div>
          </div>
          <div className="music-layer-meter">
            {layers.map(layer=>(
              <div key={layer}>
                <span>{t.layers[layer]}</span>
                <i><b style={{width:String(Math.round(state.layers[layer].weight*100))+'%'}} /></i>
                <em>{Math.round(state.layers[layer].weight*100)}</em>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="music-lab-section">
        <div className="music-lab-section-head"><span>{e.pipeline}</span><strong>LEFT → RIGHT → CORTEX → MEMORY</strong></div>
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
          <div><strong>{concepts.toLocaleString()}</strong><span>{vi?'concept âm nhạc':'music concepts'}</span></div>
          <div><strong>{relations.toLocaleString()}</strong><span>{vi?'quan hệ knowledge graph':'knowledge relations'}</span></div>
          <div><strong>{semanticNodes.toLocaleString()}</strong><span>{vi?'node genre/style semantic':'semantic genre/style nodes'}</span></div>
          <div><strong>11</strong><span>{vi?'miền tri thức':'knowledge domains'}</span></div>
        </div>
        <p className="music-knowledge-note">{vi
          ? 'Nhạc lý, rhythm, form, nhạc cụ, vocal, production, psychoacoustics, lịch sử, recording identity, world/regional music và genre/style cùng sống trong một graph có cấu trúc.'
          : 'Theory, rhythm, form, instruments, vocal, production, psychoacoustics, history, recording identity, world/regional music and genre/style live in one structured graph.'}</p>
      </section>
      <section className="music-lab-section">
        <div className="music-lab-section-head"><span>{e.composition}</span><strong>{state.composition?'LIVE SCORE':'IDLE'}</strong></div>
        <div className="music-composer-public">
          {state.composition ? (
            <>
              <div className="music-composer-copy">
                <span>{state.composition.title}</span>
                <h2>{state.composition.key} {state.composition.mode.toUpperCase()}</h2>
                <p>{state.composition.bpm} BPM · {state.composition.meter} · {state.composition.bars} BARS · {state.composition.voice.toUpperCase()}</p>
                <p>{state.composition.chordProgression.join(' → ')}</p>
              </div>
              <div className="music-composer-sketch">
                <div className="music-composer-sketch-head">
                  <span>{vi?'SKETCH HIỆN TẠI':'CURRENT SKETCH'}</span>
                  <HummingPlayer composition={state.composition} locale={locale} showPanel={false}/>
                </div>
                <HummingScore composition={state.composition}/>
                <div className="music-composer-sketch-meta">
                  <span>{vi?'câu hỏi':'question'} → {vi?'trả lời':'answer'}</span>
                  <span>{state.composition.notes.length} NOTES · {state.composition.chordProgression.join(' / ')}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="music-composer-idle">
              <span>{vi?'COMPOSER ĐANG NGHỈ':'COMPOSER RESTING'}</span>
              <p>{e.noComposition}</p>
            </div>
          )}
        </div>
        <div className="music-memory-rule"><span>ORIGINALITY / MEMORY BOUNDARY</span><p>{e.privacy}</p></div>
      </section>
    </main>
  )
}
