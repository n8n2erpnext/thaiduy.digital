import pack from './data/music-k2-general.json'
import type { MusicKnowledgeKind, MusicKnowledgeNode } from './knowledge'

export type MusicK2Domain = 'theory'|'rhythm'|'form'|'instrument'|'vocal'|'production'|'audio'|'history'|'recording'|'world'|'genre'
export type MusicK2Concept = {
  id: string
  domain: MusicK2Domain
  kind: string
  label: string
  aliases: string[]
  parents: string[]
  related: string[]
  description: string
  properties: Record<string, unknown>
  semantic?: { kind: MusicKnowledgeKind; family: string }
}

export const MUSIC_K2_VERSION = pack.version
export const MUSIC_K2_CONCEPTS = pack.concepts as MusicK2Concept[]

export const MUSIC_K2_HEMISPHERE: Record<MusicK2Domain,string> = {
  theory:'knowledge-theory', rhythm:'knowledge-rhythm', form:'knowledge-form', instrument:'knowledge-inst',
  vocal:'knowledge-vocal', production:'knowledge-prod', audio:'knowledge-audio', history:'knowledge-hist',
  recording:'knowledge-rec', world:'knowledge-world', genre:'knowledge-genre',
}

export const MUSIC_K2_SEMANTIC_NODES: MusicKnowledgeNode[] = MUSIC_K2_CONCEPTS.flatMap(concept => {
  if (!concept.semantic) return []
  return [{
    id:concept.id.replace(/^genre:/,''), family:concept.semantic.family, kind:concept.semantic.kind,
    aliases:[concept.label, ...concept.aliases],
  }]
})

const normalize = (value:string) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ')
const conceptIndex = new Map(MUSIC_K2_CONCEPTS.flatMap(concept => [concept.label,...concept.aliases].map(alias => [normalize(alias),concept] as const)))
const conceptById = new Map(MUSIC_K2_CONCEPTS.map(concept => [concept.id,concept] as const))
export function findMusicK2Concept(value:string) { return conceptIndex.get(normalize(value)) ?? null }
export function musicK2Neighborhood(id:string) {
  const concept = conceptById.get(id) ?? null
  if (!concept) return null
  return {
    concept,
    parents:concept.parents.flatMap(parent => conceptById.get(parent) ? [conceptById.get(parent)!] : []),
    related:concept.related.flatMap(item => conceptById.get(item) ? [conceptById.get(item)!] : []),
  }
}
