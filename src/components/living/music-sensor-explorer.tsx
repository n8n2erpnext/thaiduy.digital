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
  const track=state.track
    ? state.track.title+' — '+state.track.artist
    : state.signal==='dsp'
      ? (vi?'Live DSP · chưa có metadata từ Android':'Live DSP · Android metadata unavailable')
      : (vi?'Không có bài đang phát':'No active playback')
  const modeLabel=vi
    ? (state.mode==='listening'?'ĐANG NGHE':state.mode==='humming'?'ĐANG NGÂN NGA':'ĐANG NGHỈ')
    : state.mode.toUpperCase()
  const signalLabel=vi
    ? (state.signal==='offline'?'OFFLINE':state.signal==='dsp'?'DSP LIVE':'NGỮ NGHĨA')
    : state.signal.toUpperCase()
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
