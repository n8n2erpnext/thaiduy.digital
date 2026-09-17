import assert from 'node:assert/strict'
import { runLunaCycle } from '@/brains/core/luna-kernel'
import { musicSensorKernel } from '@/brains/music-sensor/kernel'
import { musicTrackMemoryKey } from '@/brains/music-sensor/service'
import type { MusicSensorInput } from '@/brains/music-sensor/types'

const audioBase = {
  rms:0.42, bass:0.36, lowMid:0.48, mid:0.66, presence:0.52, air:0.3,
  vocalProbability:0.35, spectralFlux:0.32, beatConfidence:0.9,
} as const

const cases: Array<{ name:string; input:MusicSensorInput }> = [
  {
    name:'jazz-to-swing',
    input:{ artist:'QA', title:'Jazz Swing', tags:[
      { name:'jazz', weight:95, source:'lastfm-track' },
      { name:'swing', weight:78, source:'lastfm-track' },
    ], audio:{ ...audioBase, swingness:0.9, tempoBpm:132, meter:'4/4' } },
  },
  {
    name:'waltz-to-tango',
    input:{ artist:'QA', title:'Valse Tango', tags:[
      { name:'valse', weight:94, source:'lastfm-track' },
    ], audio:{ ...audioBase, tempoBpm:124, meter:'4/4', rhythmHints:{ tango:0.91 } } },
  },
  {
    name:'classical-acoustic-ensemble',
    input:{ artist:'QA', title:'Classical Acoustic', tags:[
      { name:'classical', weight:97, source:'lastfm-track' },
      { name:'orchestral', weight:82, source:'musicbrainz' },
      { name:'acoustic', weight:88, source:'lastfm-track' },
      { name:'instrumental', weight:90, source:'lastfm-track' },
    ], audio:{ ...audioBase, vocalProbability:0.03, mid:0.82, presence:0.64, meter:'4/4' } },
  },
  {
    name:'pop-acoustic-instrumental',
    input:{ artist:'QA', title:'Pop Acoustic', tags:[
      { name:'pop', weight:96, source:'lastfm-track' },
      { name:'acoustic', weight:91, source:'lastfm-track' },
      { name:'instrumental', weight:87, source:'lastfm-track' },
    ], audio:{ ...audioBase, vocalProbability:0.04, lowMid:0.72, mid:0.8 } },
  },
  {
    name:'tag-noise-separation',
    input:{ artist:'QA', title:'Noise Tags', tags:[
      { name:'jazz', weight:81, source:'lastfm-track' },
      { name:'female vocalists', weight:100, source:'lastfm-track' },
      { name:'seen live', weight:100, source:'lastfm-track' },
      { name:'80s', weight:100, source:'lastfm-track' },
    ], audio:{ ...audioBase, vocalProbability:0.78 } },
  },
  {
    name:'track-vs-artist-vote',
    input:{ artist:'QA', title:'Vote Priority', tags:[
      { name:'jazz', weight:70, source:'lastfm-track' },
      { name:'rock', weight:100, source:'lastfm-artist' },
    ], audio:{ ...audioBase } },
  },
  {
    name:'identity-without-tags',
    input:{ artist:'QA', title:'Known Name Unknown Genre', audio:{ ...audioBase } },
  },
  {
    name:'vocal-track-instrumental-break',
    input:{ artist:'QA', title:'Instrumental Break', tags:[
      { name:'pop', weight:90, source:'lastfm-track' },
      { name:'female vocalists', weight:95, source:'lastfm-track' },
    ], audio:{ ...audioBase, vocalProbability:0.03, mid:0.82 } },
  },
]

for (const test of cases) {
  const result = await runLunaCycle(musicSensorKernel, test.input)
  const state = result.decision.state
  if (test.name === 'jazz-to-swing') {
    assert.equal(state.catalogGenre, 'jazz')
    assert.equal(state.catalogStyle, 'swing')
    assert.equal(state.performedStyle, 'swing')
    assert.equal(state.reinterpretation, false)
  }
  if (test.name === 'waltz-to-tango') {
    assert.equal(state.catalogStyle, 'waltz')
    assert.equal(state.performedStyle, 'tango')
    assert.equal(state.reinterpretation, true)
  }
  if (test.name === 'classical-acoustic-ensemble') {
    assert.equal(state.catalogGenre, 'classical')
    assert.equal(state.catalogStyle, 'orchestral')
    assert.equal(state.arrangement, 'acoustic')
    assert.equal(state.texture, 'instrumental-ensemble')
  }
  if (test.name === 'pop-acoustic-instrumental') {
    assert.equal(state.catalogGenre, 'pop')
    assert.equal(state.arrangement, 'acoustic')
    assert.equal(state.texture, 'instrumental-ensemble')
    assert.notEqual(state.catalogGenre, 'classical')
  }
  if (test.name === 'tag-noise-separation') {
    assert.equal(state.catalogGenre, 'jazz')
    assert.equal(state.texture, 'vocal-female')
    assert.deepEqual(result.left.evidence[0]?.value.unknownTags, [])
  }
  if (test.name === 'track-vs-artist-vote') {
    assert.equal(state.catalogGenre, 'jazz')
  }
  if (test.name === 'identity-without-tags') {
    assert.equal(state.catalogGenre, null)
    assert.equal(result.left.evidence[0]?.value.classificationConfidence, 0.1)
  }
  if (test.name === 'vocal-track-instrumental-break') {
    assert.equal(state.catalogGenre, 'pop')
    assert.equal(state.texture, 'instrumental')
    assert.notEqual(state.dominantLayer, 'vocal')
  }
  console.log(JSON.stringify({ name:test.name, ...state }))
}

const studioKey = musicTrackMemoryKey({ artist:'Same Artist', title:'Same Song', identity:{ fingerprintId:'fp-studio' } })
const liveKey = musicTrackMemoryKey({ artist:'Same Artist', title:'Same Song', identity:{ fingerprintId:'fp-live' } })
assert.notEqual(studioKey, liveKey)
console.log(JSON.stringify({ name:'recording-memory-separation', studioKey, liveKey }))

console.log(`PASS ${cases.length}/${cases.length}`)
process.exit(0)
