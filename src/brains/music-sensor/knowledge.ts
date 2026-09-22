import { listBrainMemory } from '@/brains/core/memory-store'
import { findMusicK2Concept, MUSIC_K2_SEMANTIC_NODES } from './k2-general'
import type { MusicSensorInput } from './types'

export type MusicKnowledgeKind = 'genre' | 'style' | 'dance' | 'mood' | 'texture' | 'arrangement' | 'context' | 'ignore'
export type MusicKnowledgeNode = {
  id: string; family: string; kind: MusicKnowledgeKind; aliases: string[]
  wave?: Partial<Record<'bass'|'lowMid'|'mid'|'vocal'|'presence'|'air', number>>
}

export const MUSIC_KNOWLEDGE_VERSION = 'music-k2.0'

export const SOURCE_WEIGHT: Record<string, number> = {
  'lastfm-track': 1, musicbrainz: 0.95, listenbrainz: 0.9,
  'lastfm-artist': 0.38, memory: 0.82, heuristic: 0.32, unknown: 0.55,
}

export const MUSIC_NODES: MusicKnowledgeNode[] = [
  { id:'classical', family:'classical', kind:'genre', aliases:['classical','classical music'], wave:{mid:0.82,presence:0.58,air:0.5} },
  { id:'orchestral', family:'classical', kind:'style', aliases:['orchestral','orchestra','symphonic'], wave:{mid:0.85,presence:0.72,air:0.66} },
  { id:'chamber-music', family:'classical', kind:'style', aliases:['chamber music','chamber classical'], wave:{mid:0.9,presence:0.62,air:0.46} },
  { id:'string-quartet', family:'classical', kind:'style', aliases:['string quartet','quartet'] },
  { id:'solo-piano', family:'instrumental', kind:'texture', aliases:['solo piano','piano solo'], wave:{mid:0.9,presence:0.54,air:0.42} },
  { id:'acoustic-guitar', family:'instrumental', kind:'texture', aliases:['acoustic guitar','acoustic guitar instrumental'], wave:{lowMid:0.74,mid:0.86,presence:0.58} },
  { id:'instrumental-ensemble', family:'instrumental', kind:'texture', aliases:['instrumental ensemble','instrumental music','instrumental'], wave:{mid:0.84,presence:0.62} },
  { id:'opera', family:'classical', kind:'style', aliases:['opera','operatic'], wave:{vocal:1,mid:0.76,air:0.5} },
  { id:'jazz', family:'jazz', kind:'genre', aliases:['jazz'] },
  { id:'swing', family:'jazz', kind:'style', aliases:['swing','swing jazz','big band'], wave:{mid:0.88,presence:0.72,bass:0.52} },
  { id:'bebop', family:'jazz', kind:'style', aliases:['bebop','bop'] },
  { id:'cool-jazz', family:'jazz', kind:'style', aliases:['cool jazz'] },
  { id:'jazz-fusion', family:'jazz', kind:'style', aliases:['jazz fusion','fusion jazz'] },
  { id:'vocal-jazz', family:'jazz', kind:'style', aliases:['vocal jazz','jazz vocals'], wave:{vocal:1,mid:0.8,presence:0.62} },
  { id:'blues', family:'blues', kind:'genre', aliases:['blues'] },
  { id:'blues-rock', family:'blues', kind:'style', aliases:['blues rock','blues-rock'], wave:{bass:0.72,mid:0.7,presence:0.82} },
  { id:'rock', family:'rock', kind:'genre', aliases:['rock','rock music'], wave:{bass:0.7,lowMid:0.52,mid:0.72,presence:0.82,air:0.34} },
  { id:'hard-rock', family:'rock', kind:'style', aliases:['hard rock'] },
  { id:'alternative-rock', family:'rock', kind:'style', aliases:['alternative rock','alt rock'] },
  { id:'indie-rock', family:'rock', kind:'style', aliases:['indie rock'] },
  { id:'progressive-rock', family:'rock', kind:'style', aliases:['progressive rock','prog rock'] },
  { id:'punk', family:'rock', kind:'style', aliases:['punk','punk rock'] },
  { id:'grunge', family:'rock', kind:'style', aliases:['grunge'] },
  { id:'metal', family:'metal', kind:'genre', aliases:['metal','heavy metal'] },
  { id:'thrash-metal', family:'metal', kind:'style', aliases:['thrash metal'] },
  { id:'pop', family:'pop', kind:'genre', aliases:['pop','pop music'], wave:{bass:0.44,lowMid:0.48,mid:0.76,vocal:0.78,presence:0.62,air:0.38} },
  { id:'synthpop', family:'pop', kind:'style', aliases:['synthpop','synth pop'] },
  { id:'dance-pop', family:'pop', kind:'style', aliases:['dance pop','dance-pop'] },
  { id:'v-pop', family:'pop', kind:'style', aliases:['v-pop','vpop','viet pop','vietnamese pop'] },
  { id:'k-pop', family:'pop', kind:'style', aliases:['k-pop','kpop'] },
  { id:'electronic', family:'electronic', kind:'genre', aliases:['electronic','electronica'] },
  { id:'house', family:'electronic', kind:'style', aliases:['house','deep house'] },
  { id:'techno', family:'electronic', kind:'style', aliases:['techno'] },
  { id:'trance', family:'electronic', kind:'style', aliases:['trance'] },
  { id:'ambient', family:'electronic', kind:'style', aliases:['ambient'] },
  { id:'lofi', family:'electronic', kind:'style', aliases:['lofi','lo-fi','lo fi','chillhop'], wave:{lowMid:0.9,mid:0.62,air:0.2} },
  { id:'hip-hop', family:'hip-hop', kind:'genre', aliases:['hip hop','hip-hop','rap'] },
  { id:'rnb', family:'soul-rnb', kind:'genre', aliases:['r&b','rnb','rhythm and blues'] },
  { id:'soul', family:'soul-rnb', kind:'genre', aliases:['soul'] },
  { id:'funk', family:'soul-rnb', kind:'style', aliases:['funk'], wave:{bass:0.95,lowMid:0.7,presence:0.62} },
  { id:'folk', family:'folk-country', kind:'genre', aliases:['folk','folk music'] },
  { id:'country', family:'folk-country', kind:'genre', aliases:['country','country music'] },
  { id:'acoustic', family:'arrangement', kind:'arrangement', aliases:['acoustic','unplugged'], wave:{lowMid:0.76,mid:0.88,presence:0.5,air:0.4} },
  { id:'ballad', family:'song-form', kind:'style', aliases:['ballad','slow ballad','power ballad'], wave:{vocal:0.9,mid:0.72,lowMid:0.62} },
  { id:'bossa-nova', family:'latin', kind:'style', aliases:['bossa nova','bossa'], wave:{mid:0.82,lowMid:0.58,air:0.48} },
  { id:'samba', family:'latin', kind:'style', aliases:['samba'] },
  { id:'tango', family:'dance', kind:'dance', aliases:['tango'] },
  { id:'waltz', family:'dance', kind:'dance', aliases:['waltz','valse','vals'] },
  { id:'bolero', family:'latin', kind:'style', aliases:['bolero','bolero vietnamese','nhac bolero'] },
  { id:'vietnamese-sentimental', family:'vietnamese', kind:'style', aliases:['nhac tru tinh','nhạc trữ tình','tru tinh','nhac vang','nhạc vàng'] },
  { id:'romantic', family:'mood', kind:'mood', aliases:['romantic','love','love songs'] },
  { id:'melancholic', family:'mood', kind:'mood', aliases:['melancholic','melancholy','sad','sorrow'] },
  { id:'dreamy', family:'mood', kind:'mood', aliases:['dreamy','ethereal'] },
  { id:'energetic', family:'mood', kind:'mood', aliases:['energetic','upbeat','high energy'] },
  { id:'dark', family:'mood', kind:'mood', aliases:['dark','brooding'] },
  { id:'warm', family:'mood', kind:'mood', aliases:['warm','intimate'] },
  { id:'chill', family:'mood', kind:'mood', aliases:['chill','chillout','relaxing','relax'] },
  { id:'vocal-female', family:'vocal', kind:'texture', aliases:['female vocalists','female vocalist','female vocals'] },
  { id:'vocal-male', family:'vocal', kind:'texture', aliases:['male vocalists','male vocalist','male vocals'] },
  { id:'instrumental-track', family:'instrumental', kind:'texture', aliases:['instrumentals'] },
  { id:'live', family:'arrangement', kind:'arrangement', aliases:['live','live recording','live version'] },
  { id:'remix', family:'arrangement', kind:'arrangement', aliases:['remix','remixed'] },
  { id:'cover', family:'arrangement', kind:'arrangement', aliases:['cover','cover version'] },
  { id:'soundtrack', family:'context', kind:'context', aliases:['soundtrack','ost','film score'] },
  { id:'era-80s', family:'context', kind:'context', aliases:['80s','1980s'] },
  { id:'era-90s', family:'context', kind:'context', aliases:['90s','1990s'] },
  { id:'seen-live', family:'noise', kind:'ignore', aliases:['seen live'] },
  { id:'favorites', family:'noise', kind:'ignore', aliases:['favorites','favourite','favorite'] },
]


MUSIC_NODES.push(
  { id:'baroque', family:'classical', kind:'style', aliases:['baroque','baroque classical'] },
  { id:'romantic-classical', family:'classical', kind:'style', aliases:['romantic classical','romantic era'] },
  { id:'impressionist', family:'classical', kind:'style', aliases:['impressionist','impressionism'] },
  { id:'contemporary-classical', family:'classical', kind:'style', aliases:['contemporary classical','modern classical'] },
  { id:'concerto', family:'classical', kind:'style', aliases:['concerto'] },
  { id:'sonata', family:'classical', kind:'style', aliases:['sonata'] },
  { id:'hard-bop', family:'jazz', kind:'style', aliases:['hard bop'] },
  { id:'smooth-jazz', family:'jazz', kind:'style', aliases:['smooth jazz'] },
  { id:'latin-jazz', family:'jazz', kind:'style', aliases:['latin jazz'] },
  { id:'free-jazz', family:'jazz', kind:'style', aliases:['free jazz'] },
  { id:'delta-blues', family:'blues', kind:'style', aliases:['delta blues'] },
  { id:'chicago-blues', family:'blues', kind:'style', aliases:['chicago blues'] },
  { id:'soft-rock', family:'rock', kind:'style', aliases:['soft rock'], wave:{bass:0.42,lowMid:0.58,mid:0.78,vocal:0.84,presence:0.6,air:0.32} },
  { id:'psychedelic-rock', family:'rock', kind:'style', aliases:['psychedelic rock','psych rock'] },
  { id:'post-rock', family:'rock', kind:'style', aliases:['post-rock','post rock'] },
  { id:'doom-metal', family:'metal', kind:'style', aliases:['doom metal'] },
  { id:'power-metal', family:'metal', kind:'style', aliases:['power metal'] },
  { id:'symphonic-metal', family:'metal', kind:'style', aliases:['symphonic metal'] },
  { id:'progressive-metal', family:'metal', kind:'style', aliases:['progressive metal','prog metal'] },
  { id:'downtempo', family:'electronic', kind:'style', aliases:['downtempo'] },
  { id:'drum-and-bass', family:'electronic', kind:'style', aliases:['drum and bass','dnb','drum & bass'] },
  { id:'dubstep', family:'electronic', kind:'style', aliases:['dubstep'] },
  { id:'synthwave', family:'electronic', kind:'style', aliases:['synthwave','retrowave'] },
  { id:'trip-hop', family:'electronic', kind:'style', aliases:['trip hop','trip-hop'] },
)


MUSIC_NODES.push(
  { id:'trap', family:'hip-hop', kind:'style', aliases:['trap','trap music'] },
  { id:'boom-bap', family:'hip-hop', kind:'style', aliases:['boom bap','boom-bap'] },
  { id:'lofi-hiphop', family:'hip-hop', kind:'style', aliases:['lofi hip hop','lo-fi hip hop'] },
  { id:'neo-soul', family:'soul-rnb', kind:'style', aliases:['neo soul','neo-soul'] },
  { id:'disco', family:'soul-rnb', kind:'style', aliases:['disco'] },
  { id:'reggae', family:'reggae', kind:'genre', aliases:['reggae'] },
  { id:'dub', family:'reggae', kind:'style', aliases:['dub','dub reggae'] },
  { id:'ska', family:'reggae', kind:'style', aliases:['ska'] },
  { id:'salsa', family:'latin', kind:'style', aliases:['salsa'] },
  { id:'bachata', family:'latin', kind:'style', aliases:['bachata'] },
  { id:'rumba', family:'latin', kind:'style', aliases:['rumba'] },
  { id:'flamenco', family:'latin', kind:'style', aliases:['flamenco'] },
  { id:'bluegrass', family:'folk-country', kind:'style', aliases:['bluegrass'] },
  { id:'new-age', family:'new-age', kind:'genre', aliases:['new age','new-age'] },
  { id:'cinematic', family:'soundtrack', kind:'style', aliases:['cinematic','cinematic music'], wave:{mid:0.82,presence:0.76,air:0.74} },
  { id:'cai-luong', family:'vietnamese', kind:'style', aliases:['cai luong','cải lương'] },
  { id:'vong-co', family:'vietnamese', kind:'style', aliases:['vong co','vọng cổ'] },
  { id:'dan-ca', family:'vietnamese', kind:'style', aliases:['dan ca','dân ca','vietnamese folk'] },
  { id:'quan-ho', family:'vietnamese', kind:'style', aliases:['quan ho','quan họ'] },
  { id:'nhac-tre', family:'pop', kind:'style', aliases:['nhac tre','nhạc trẻ'] },
)


MUSIC_NODES.push(
  { id:'piano-led', family:'instrumental', kind:'texture', aliases:['piano','piano instrumental'], wave:{mid:0.92,presence:0.56,air:0.38} },
  { id:'saxophone-led', family:'instrumental', kind:'texture', aliases:['saxophone','sax instrumental','sax'], wave:{mid:0.9,presence:0.82,air:0.38} },
  { id:'strings-led', family:'instrumental', kind:'texture', aliases:['strings','string ensemble','violin instrumental'], wave:{mid:0.86,presence:0.62,air:0.7} },
  { id:'guitar-led', family:'instrumental', kind:'texture', aliases:['guitar instrumental','guitar'], wave:{lowMid:0.74,mid:0.82,presence:0.62} },
  { id:'choir', family:'vocal', kind:'texture', aliases:['choir','choral','chorale'], wave:{vocal:1,mid:0.82,air:0.72} },
  { id:'duet', family:'vocal', kind:'texture', aliases:['duet','duo vocals'], wave:{vocal:0.96,mid:0.72,presence:0.58} },
  { id:'a-cappella', family:'vocal', kind:'texture', aliases:['a cappella','acapella'], wave:{vocal:1,mid:0.78,presence:0.64,air:0.55} },
)

MUSIC_NODES.push(
  { id:'pop-rock', family:'rock', kind:'style', aliases:['pop rock','pop-rock'], wave:{bass:0.54,mid:0.78,vocal:0.76,presence:0.72} },
  { id:'indie-pop', family:'pop', kind:'style', aliases:['indie pop','indie-pop'] },
  { id:'city-pop', family:'pop', kind:'style', aliases:['city pop','city-pop','japanese city pop'] },
  { id:'dream-pop', family:'pop', kind:'style', aliases:['dream pop','dream-pop'], wave:{mid:0.7,vocal:0.6,presence:0.44,air:0.82} },
  { id:'art-pop', family:'pop', kind:'style', aliases:['art pop','art-pop'] },
  { id:'electropop', family:'pop', kind:'style', aliases:['electropop','electro pop'] },
  { id:'shoegaze', family:'rock', kind:'style', aliases:['shoegaze','shoe gaze'], wave:{mid:0.82,presence:0.76,air:0.72} },
  { id:'britpop', family:'rock', kind:'style', aliases:['britpop','brit pop'] },
  { id:'garage-rock', family:'rock', kind:'style', aliases:['garage rock','garage-rock'] },
  { id:'post-punk', family:'rock', kind:'style', aliases:['post-punk','post punk'] },
  { id:'new-wave', family:'rock', kind:'style', aliases:['new wave','new-wave'] },
  { id:'death-metal', family:'metal', kind:'style', aliases:['death metal'] },
  { id:'black-metal', family:'metal', kind:'style', aliases:['black metal'] },
  { id:'metalcore', family:'metal', kind:'style', aliases:['metalcore','metal core'] },
  { id:'nu-metal', family:'metal', kind:'style', aliases:['nu metal','nu-metal'] },
  { id:'alternative-hip-hop', family:'hip-hop', kind:'style', aliases:['alternative hip hop','alternative hip-hop'] },
  { id:'jazz-rap', family:'hip-hop', kind:'style', aliases:['jazz rap','jazz-rap'] },
  { id:'drill', family:'hip-hop', kind:'style', aliases:['drill','drill music'] },
  { id:'contemporary-rnb', family:'soul-rnb', kind:'style', aliases:['contemporary r&b','contemporary rnb'] },
)

MUSIC_NODES.push(
  { id:'easy-listening', family:'pop', kind:'style', aliases:['easy listening','easy-listening'] },
  { id:'adult-contemporary', family:'pop', kind:'style', aliases:['adult contemporary','adult-contemporary','ac music'] },
  { id:'singer-songwriter', family:'folk-country', kind:'style', aliases:['singer-songwriter','singer songwriter'] },
  { id:'folk-rock', family:'folk-country', kind:'style', aliases:['folk rock','folk-rock'] },
  { id:'neo-classical', family:'classical', kind:'style', aliases:['neoclassical','neo-classical','neo classical'] },
  { id:'minimalism', family:'classical', kind:'style', aliases:['minimalism','minimalist classical'] },
  { id:'gospel', family:'soul-rnb', kind:'style', aliases:['gospel','gospel music'] },
  { id:'nhac-do', family:'vietnamese', kind:'style', aliases:['nhac do','nhạc đỏ','red music vietnam'] },
  { id:'que-huong', family:'vietnamese', kind:'style', aliases:['que huong','quê hương','nhac que huong','nhạc quê hương'] },
  { id:'tien-chien', family:'vietnamese', kind:'style', aliases:['tien chien','tiền chiến','nhac tien chien','nhạc tiền chiến'] },
  { id:'boy-band', family:'context', kind:'context', aliases:['boyband','boybands','boy band','boy bands'] },
  { id:'era-00s', family:'context', kind:'context', aliases:['00s','2000s'] },
  { id:'geo-vietnam', family:'context', kind:'context', aliases:['vietnam','vietnamese'] },
  { id:'geo-british', family:'context', kind:'context', aliases:['british','uk','united kingdom'] },
  { id:'geo-irish', family:'context', kind:'context', aliases:['irish','ireland'] },
  { id:'geo-danish', family:'context', kind:'context', aliases:['danish','denmark'] },
  { id:'idol-tag', family:'noise', kind:'ignore', aliases:['idol'] },
)

const normalize = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')

// K2 expands semantic coverage without overriding hand-curated aliases above.
{
  const claimedAliases = new Set(MUSIC_NODES.flatMap(node => node.aliases.map(normalize)))
  const claimedIds = new Set(MUSIC_NODES.map(node => node.id))
  for (const node of MUSIC_K2_SEMANTIC_NODES) {
    if (claimedIds.has(node.id)) continue
    const aliases = node.aliases.filter(alias => !claimedAliases.has(normalize(alias)))
    if (!aliases.length) continue
    MUSIC_NODES.push({ ...node, aliases })
    claimedIds.add(node.id)
    for (const alias of aliases) claimedAliases.add(normalize(alias))
  }
}

export function classifyMusicTags(tags: NonNullable<MusicSensorInput['tags']>, nodes: MusicKnowledgeNode[] = MUSIC_NODES, sourceWeights: Record<string, number> = SOURCE_WEIGHT) {
  const aliasIndex = new Map(nodes.flatMap(node => node.aliases.map(alias => [normalize(alias), node] as const)))
  const genreVotes: Record<string, number> = {}, styleVotes: Record<string, number> = {}
  const moodVotes: Record<string, number> = {}, textureVotes: Record<string, number> = {}
  const arrangementVotes: Record<string, number> = {}, contextConcepts: string[] = [], unknown: string[] = []
  for (const tag of tags) {
    const node = aliasIndex.get(normalize(tag.name))
    if (!node) {
      const concept = findMusicK2Concept(tag.name)
      if (concept) { if (!contextConcepts.includes(concept.id)) contextConcepts.push(concept.id); continue }
      unknown.push(tag.name)
      continue
    }
    if (node.kind === 'ignore' || node.kind === 'context') continue
    const raw=tag.weight>1?tag.weight/100:tag.weight
    const sourceWeight=sourceWeights[tag.source ?? 'unknown'] ?? sourceWeights.unknown ?? 0.7
    const vote=Math.max(0,Math.min(1,raw))*sourceWeight
    const artistPrior=tag.source==='lastfm-artist'

    // Artist metadata is a broad prior, never track-level proof of a specific
    // performance style or arrangement. This avoids same-name artist collisions
    // and prevents an artist's general profile from overwriting the current track.
    if (artistPrior && (node.kind==='style' || node.kind==='arrangement')) {
      if (node.kind==='style' && node.family!=='song-form' && node.family!=='arrangement') {
        genreVotes[node.family]=Math.max(genreVotes[node.family] ?? 0,vote*.34)
      }
      continue
    }

    const bucket=node.kind==='genre'?genreVotes:node.kind==='mood'?moodVotes
      :node.kind==='texture'?textureVotes:node.kind==='arrangement'?arrangementVotes:styleVotes
    bucket[node.id]=Math.max(bucket[node.id] ?? 0,vote)
    if (node.kind==='style' && node.family!=='song-form' && node.family!=='arrangement') {
      genreVotes[node.family]=Math.max(genreVotes[node.family] ?? 0,vote*.62)
    }
  }
  return { genreVotes, styleVotes, moodVotes, textureVotes, arrangementVotes, contextConcepts, unknownTags: unknown }
}

export function topVote(votes: Record<string, number>) {
  return Object.entries(votes).sort((a, b) => b[1] - a[1])[0] ?? null
}
export function musicKnowledgeNode(id: string | null | undefined) {
  return id ? MUSIC_NODES.find(node => node.id === id) ?? null : null
}

export function sameMusicalFamily(a: string | null, b: string | null, nodes: MusicKnowledgeNode[] = MUSIC_NODES) {
  if (!a || !b) return true
  const left = nodes.find(node => node.id === a) ?? null, right = nodes.find(node => node.id === b) ?? null
  if (!left || !right) return a === b
  if (left.kind === 'dance' && right.kind === 'dance') return left.id === right.id
  return left.family === right.family || left.id === right.id
}

export function waveHintFor(id: string | null | undefined, nodes: MusicKnowledgeNode[] = MUSIC_NODES) {
  return id ? nodes.find(node => node.id === id)?.wave ?? {} : {}
}
export const ACOUSTIC_ARCHETYPES = [
  { id:'vocal-led', cue:'vocalProbability', min:0.64, meaning:'Voice is the foreground texture; vocal wave may become dominant.' },
  { id:'instrumental', cue:'vocalProbability', max:0.15, meaning:'No strong voice evidence; never infer Classical from this alone.' },
  { id:'swing', cue:'swingness', min:0.55, beatConfidenceMin:0.45, meaning:'Performed swing feel; compatible with Jazz but not exclusive to Jazz.' },
  { id:'waltz', cue:'meter', equals:'3/4', beatConfidenceMin:0.55, confidenceScale:0.72, meaning:'Triple-meter dance feel; does not imply Classical.' },
  { id:'tango', cue:'rhythmHint:tango', min:0.55, meaning:'Require rhythm classifier evidence; tempo alone is insufficient.' },
  { id:'bossa-nova', cue:'rhythmHint:bossa-nova', min:0.55, meaning:'Require characteristic rhythm evidence.' },
  { id:'samba', cue:'rhythmHint:samba', min:0.55, meaning:'Require characteristic rhythm evidence.' },
  { id:'ballad', cue:'tempo+vocal+energy', maxTempo:92, minVocal:0.58, maxRms:0.5, confidence:0.45 },
] as const


export const CORTEX_MUSIC_POLICY = {
  styleOverrideMin:0.55,
  vocalDominantMin:0.64,
  intenseEnergyMin:0.72,
  aliveEnergyMin:0.38,
  intimateVocalMin:0.68,
  intimateEnergyMax:0.38,
  smoothingBase:0.84,
  smoothingEnergySlope:0.3,
  attackBase:0.24,
  attackFluxGain:0.55,
  releaseBase:0.66,
  releaseQuietGain:0.22,
}

export const CORTEX_MUSIC_RULES = [
  'Keep catalogGenre, catalogStyle, arrangement and texture as separate dimensions.',
  'Instrumental is a texture, not a genre. Acoustic is an arrangement, not a genre.',
  'Never infer Classical merely from piano, violin, orchestra-like timbre, or lack of vocals.',
  'Track-level tags outrank artist-level tags; artist tags are fallback priors only.',
  'Live acoustic evidence describes the current performance and may override catalog style when confidence is sufficient.',
  'Jazz catalog plus Swing performance is compatible; Waltz catalog style plus Tango performance is reinterpretation.',
  'Unknown evidence stays unknown. Do not force a genre to make the UI look complete.',
  'Genre shapes wave personality; realtime signal controls what the wave does now.',
  'When voice is dominant, vocal layer gains prominence; during instrumental breaks, acoustic bands take over smoothly.',
  'Hysteresis and crossfade prevent rapid style flapping between close candidates.',
  'Tempo and meter describe motion and form; neither is sufficient genre evidence by itself.',
  'Country, language, decade, fandom and artist-name tags are context, not genre labels.',
  'A style may contribute evidence to its musical family, but a broad family must not invent a specific style.',
  'Acoustic evidence describes the heard performance; semantic tags describe catalog and cultural context.',
  'Prefer uncertainty over false precision when evidence sources disagree or remain weak.',
] as const


export async function loadMusicSemanticKnowledge() {
  const rows = await listBrainMemory('sentinel-music', 'knowledge-left')
  const nodeRows = rows.filter(row => row.memoryKey.startsWith('node:'))
  const nodes = nodeRows.flatMap(row => {
    const value = row.value as { enabled?: boolean; node?: MusicKnowledgeNode }
    if (value.enabled === false || !value.node?.id || !Array.isArray(value.node.aliases)) return []
    return [value.node]
  })
  const sourceRow = rows.find(row => row.memoryKey === 'source-weights')
  const sourceValue = sourceRow?.value as { enabled?: boolean; weights?: Record<string, number> } | undefined
  return {
    nodes:nodeRows.length ? nodes : MUSIC_NODES,
    sourceWeights:sourceValue?.enabled === false ? Object.fromEntries(Object.keys(SOURCE_WEIGHT).map(key => [key, 1])) : sourceValue?.weights ?? SOURCE_WEIGHT,
  }
}


export async function loadMusicAcousticArchetypes() {
  const rows = await listBrainMemory('sentinel-music', 'knowledge-right')
  const archetypeRows = rows.filter(row => row.memoryKey.startsWith('archetype:'))
  const items = archetypeRows.flatMap(row => {
    const value = row.value as { enabled?: boolean; archetype?: Record<string, unknown> }
    if (value.enabled === false || !value.archetype?.id) return []
    return [value.archetype]
  })
  return archetypeRows.length ? items : ACOUSTIC_ARCHETYPES.map(item => ({ ...item }))
}

export async function loadMusicCortexPolicy() {
  const rows = await listBrainMemory('sentinel-music', 'knowledge-cortex')
  const row = rows.find(item => item.memoryKey === 'policy:thresholds')
  const value = row?.value as { enabled?: boolean; policy?: Record<string, number> } | undefined
  if (value?.enabled === false || !value?.policy) return { ...CORTEX_MUSIC_POLICY }
  return { ...CORTEX_MUSIC_POLICY, ...value.policy }
}

export const ACOUSTIC_FEATURE_KNOWLEDGE = [
  { id:'bass-band', rangeHz:[20,180], role:'body, kick and low-frequency force', waveLayer:'bass' },
  { id:'low-mid-band', rangeHz:[180,800], role:'warmth, body and lower instrument texture', waveLayer:'lowMid' },
  { id:'mid-band', rangeHz:[800,2000], role:'melodic core, many instruments and vocal body', waveLayer:'mid' },
  { id:'presence-band', rangeHz:[2000,6000], role:'attack, clarity, consonants and instrument presence', waveLayer:'presence' },
  { id:'air-band', rangeHz:[6000,16000], role:'shimmer, breath and cymbal air', waveLayer:'air' },
  { id:'rms', role:'short-window energy; drives intensity but never genre by itself' },
  { id:'spectral-flux', role:'change/transient activity; useful for attack and onset behavior' },
  { id:'spectral-centroid', role:'brightness descriptor; useful for visual air/presence character' },
  { id:'dynamic-range', role:'contrast between quiet and loud; useful for release and wave breadth' },
  { id:'tempo-bpm', role:'pulse-rate descriptor; useful for motion and phrasing but not genre by itself' },
  { id:'beat-confidence', role:'confidence that a stable beat is present; gates rhythm-style inference' },
  { id:'meter', role:'metrical grouping such as 3/4 or 4/4; form evidence, not standalone genre evidence' },
  { id:'swingness', role:'degree of uneven subdivision; supports swing feel only when beat confidence is adequate' },
  { id:'percussive-probability', role:'percussive/transient dominance; useful for groove and attack interpretation' },
  { id:'harmonic-probability', role:'sustained harmonic content; useful for texture and phrase interpretation' },
  { id:'vocal-probability', role:'voice presence; controls vocal prominence, not catalog genre' },
] as const

export const HUMMING_POLICY = {
  publicMode:'humming',
  minEnergy:0.08,
  maxEnergy:0.24,
  minDurationMs:12000,
  maxDurationMs:32000,
  minRestMs:45000,
  maxRestMs:240000,
  preemptCrossfadeMs:1600,
  neverPretendTrackPlayback:true,
  neverReproduceStoredMelody:true,
}

export const HUMMING_GRAMMARS = [
  { id:'warm-nocturnal', mood:'warm', tempo:[66,78], swing:[0.08,0.24], dominant:['lowMid','mid'], energy:[0.10,0.20] },
  { id:'soft-swing-sketch', mood:'lively-warm', tempo:[72,92], swing:[0.28,0.48], dominant:['mid','presence'], energy:[0.12,0.23] },
  { id:'ambient-breath', mood:'calm', tempo:[0,64], swing:[0,0.08], dominant:['lowMid','air'], energy:[0.08,0.17] },
  { id:'acoustic-drift', mood:'intimate', tempo:[60,82], swing:[0.05,0.18], dominant:['lowMid','mid'], energy:[0.10,0.21] },
] as const

export const RECORDING_IDENTITY_RULES = [
  'Composition identity, recording identity and performance/arrangement identity are separate concepts.',
  'Prefer exact recording evidence such as fingerprint, MusicBrainz recording MBID or ISRC over artist/title text.',
  'Live, remix, cover, acoustic and remastered versions may share a composition while requiring separate sensory memory.',
  'Playback position or fingerprint offset aligns time inside a recording; it is not genre evidence.',
  'Artist-level genre is a prior only; a specific track or performance may differ strongly from the artist baseline.',
] as const
