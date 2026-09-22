import { resolveMusicExpression,type MusicExpression,type MusicWaveArchetype } from '../src/lib/music-expression'
import { musicWaveSample } from '../src/lib/music-wave-geometry'
import { restingMusicState,type MusicCortexState } from '../src/lib/music-state'
import { classifyMusicTags,MUSIC_NODES,SOURCE_WEIGHT,topVote } from '../src/brains/music-sensor/knowledge'

const CASES=[
  ['rock','soft-rock','warm'],
  ['pop','easy-listening','calm'],
  ['jazz','smooth-jazz','lively-warm'],
  ['electronic','ambient','dreamy'],
  ['rock','shoegaze','melancholic'],
  ['electronic','synthwave','energetic'],
  ['folk','singer-songwriter','intimate'],
  ['classical','chamber-music','calm'],
  ['metal','metal','dark'],
  ['soul','neo-soul','romantic'],
  ['reggae','dub','chill'],
  ['latin','salsa','warm'],
] as const

function rgb(hex:string){
  const value=hex.slice(1)
  return [0,2,4].map(index=>Number.parseInt(value.slice(index,index+2),16)/255)
}

function luminance(hex:string){
  return rgb(hex)
    .map(value=>value<=.03928?value/12.92:Math.pow((value+.055)/1.055,2.4))
    .reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0)
}

function contrast(a:string,b:string){
  const left=luminance(a),right=luminance(b)
  const high=Math.max(left,right),low=Math.min(left,right)
  return (high+.05)/(low+.05)
}

function saturation(hex:string){
  const [r,g,b]=rgb(hex)
  const max=Math.max(r,g,b),min=Math.min(r,g,b)
  const light=(max+min)/2
  const delta=max-min
  return delta===0?0:delta/(1-Math.abs(2*light-1))
}

function stateFor(genre:string,style:string,mood:string):MusicCortexState {
  return {
    ...restingMusicState,
    mode:'listening',
    connected:true,
    signal:'semantic',
    genre,
    style,
    mood,
    energy:0,
    confidence:.8,
    texture:'mixed',
    track:{artist:'Expression QA',title:style,url:''},
  }
}

function signature(archetype:MusicWaveArchetype,expression:MusicExpression) {
  return Array.from({length:33},(_,index)=>{
    const r=index/32
    return musicWaveSample({
      archetype,
      r,
      clock:1.37,
      phase:.63,
      frequency:2.1,
      layerIndex:2,
      seed:expression.seed,
      motion:expression.motion,
    })
  })
}

function signatureDistance(a:number[],b:number[]){
  return a.reduce((sum,value,index)=>sum+Math.abs(value-b[index]),0)/a.length
}

let normalMinContrast=Infinity
let darkMinContrast=Infinity
let normalOpacity=Infinity
let darkOpacity=Infinity
let minimumSaturation=Infinity
let minArousal=Infinity
let maxArousal=-Infinity
const archetypes=new Set<MusicWaveArchetype>()
const archetypeExpressions=new Map<MusicWaveArchetype,MusicExpression>()

for(const [genre,style,mood] of CASES){
  const state=stateFor(genre,style,mood)
  for(const theme of ['normal','dark'] as const){
    const expression=resolveMusicExpression(state,theme)
    const colors=Object.values(expression.colors)

    if(new Set(colors).size<5){
      throw new Error('Palette collapsed for '+genre+'/'+style+'/'+mood+' '+theme)
    }

    minimumSaturation=Math.min(minimumSaturation,...colors.map(saturation))
    const background=theme==='normal'?'#f7faf6':'#080c0a'
    const localMin=Math.min(...colors.map(color=>contrast(color,background)))

    if(theme==='normal'){
      normalMinContrast=Math.min(normalMinContrast,localMin)
      normalOpacity=Math.min(normalOpacity,expression.motion.secondaryOpacity)
      minArousal=Math.min(minArousal,expression.arousal)
      maxArousal=Math.max(maxArousal,expression.arousal)
      archetypes.add(expression.archetype)
      if(!archetypeExpressions.has(expression.archetype)){
        archetypeExpressions.set(expression.archetype,expression)
      }
    }else{
      darkMinContrast=Math.min(darkMinContrast,localMin)
      darkOpacity=Math.min(darkOpacity,expression.motion.secondaryOpacity)
    }
  }
}

const geometry=[...archetypeExpressions.entries()].map(([archetype,expression])=>({
  archetype,
  signature:signature(archetype,expression),
}))
let minGeometryDistance=Infinity
let nearestPair=''
for(let i=0;i<geometry.length;i+=1){
  for(let j=i+1;j<geometry.length;j+=1){
    const distance=signatureDistance(geometry[i].signature,geometry[j].signature)
    if(distance<minGeometryDistance){
      minGeometryDistance=distance
      nearestPair=geometry[i].archetype+' / '+geometry[j].archetype
    }
  }
}

console.log('Music expression audit')
console.log('- representative states:',CASES.length)
console.log('- archetypes:',[...archetypes].sort().join(', '))
console.log('- normal min contrast:',normalMinContrast.toFixed(2))
console.log('- dark min contrast:',darkMinContrast.toFixed(2))
console.log('- min saturation:',minimumSaturation.toFixed(2))
console.log('- normal secondary opacity:',normalOpacity.toFixed(2))
console.log('- dark secondary opacity:',darkOpacity.toFixed(2))
console.log('- semantic arousal range:',minArousal.toFixed(2),'→',maxArousal.toFixed(2))
console.log('- closest geometry:',nearestPair,minGeometryDistance.toFixed(3))

if(normalMinContrast<3) throw new Error('Normal-mode wave contrast fell below 3.0')
if(darkMinContrast<4.5) throw new Error('Dark-mode wave contrast fell below 4.5')
if(minimumSaturation<.72) throw new Error('Wave palette saturation fell below .72')
if(normalOpacity<.78) throw new Error('Normal-mode secondary wave opacity fell below .78')
if(darkOpacity<.72) throw new Error('Dark-mode secondary wave opacity fell below .72')
if(archetypes.size<7) throw new Error('Representative genres collapsed into too few motion archetypes')
if(maxArousal-minArousal<.28) throw new Error('Semantic energy priors are not producing enough motion range')
if(minGeometryDistance<.08) throw new Error('Two motion archetypes are still geometrically too similar: '+nearestPair)

const artistPriorOnly=classifyMusicTags([
  {name:'pop',weight:100,source:'lastfm-artist'},
  {name:'singer-songwriter',weight:90,source:'lastfm-artist'},
  {name:'acoustic',weight:80,source:'lastfm-artist'},
],MUSIC_NODES,SOURCE_WEIGHT)
if(topVote(artistPriorOnly.genreVotes)?.[0]!=='pop'){
  throw new Error('Artist-prior regression: broad genre prior no longer resolves to pop')
}
if(topVote(artistPriorOnly.styleVotes)){
  throw new Error('Artist-prior regression: artist-only style leaked into track style')
}
if(topVote(artistPriorOnly.arrangementVotes)){
  throw new Error('Artist-prior regression: artist-only arrangement leaked into track arrangement')
}

const trackStyleEvidence=classifyMusicTags([
  {name:'jazz',weight:100,source:'lastfm-artist'},
  {name:'swing',weight:84,source:'lastfm-track'},
],MUSIC_NODES,SOURCE_WEIGHT)
if(topVote(trackStyleEvidence.styleVotes)?.[0]!=='swing'){
  throw new Error('Track-level style evidence stopped outranking artist priors')
}
console.log('- artist-prior semantic guard: PASS')
console.log('MUSIC EXPRESSION PASS')
