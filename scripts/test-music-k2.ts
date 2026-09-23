import { classifyMusicTags, MUSIC_KNOWLEDGE_VERSION, MUSIC_NODES } from '@/brains/music-sensor/knowledge'
import { findMusicK2Concept, MUSIC_K2_CONCEPTS, musicK2Neighborhood } from '@/brains/music-sensor/k2-general'

const assert = (ok:boolean, message:string) => { if (!ok) throw new Error(message) }
assert(MUSIC_KNOWLEDGE_VERSION === 'music-k2.1-dsp', 'wrong knowledge version')
assert(MUSIC_K2_CONCEPTS.length >= 2500, 'general graph too small')
for (const term of ['secondary dominant','polyrhythm','Cmaj7','đàn bầu','sidechain compression','VST3']) {
  assert(Boolean(findMusicK2Concept(term)), `missing concept: ${term}`)
}
const semanticCases = [['city pop','city-pop'],['shoegaze','shoegaze'],['death metal','death-metal'],['nhạc quê hương','que-huong'],['Afrobeat','afrobeat']] as const
for (const [tag, expected] of semanticCases) {
  const state = classifyMusicTags([{ name:tag, weight:100, source:'lastfm-track' }])
  const votes = { ...state.genreVotes, ...state.styleVotes }
  const top = Object.entries(votes).sort((a,b) => b[1] - a[1])[0]?.[0] ?? null
  assert(top === expected, `${tag}: expected ${expected}, got ${top}`)
}
const context = classifyMusicTags(['Cmaj7','sidechain compression','đàn bầu'].map(name => ({ name, weight:100, source:'unknown' as const })))
assert(context.contextConcepts.length === 3 && context.unknownTags.length === 0, 'general context recognition failed')
const instrumentOnly = classifyMusicTags([{ name:'instrumental', weight:100, source:'lastfm-track' }])
assert(!instrumentOnly.genreVotes.classical, 'instrumental must not imply classical')
assert(Boolean(musicK2Neighborhood(findMusicK2Concept('secondary dominant')!.id)), 'graph neighborhood lookup failed')
console.log(JSON.stringify({ pass:true, version:MUSIC_KNOWLEDGE_VERSION, concepts:MUSIC_K2_CONCEPTS.length, semanticNodes:MUSIC_NODES.length }))
