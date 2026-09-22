import type { MusicCortexState,MusicLayerName } from '@/lib/music-state'

export type MusicTheme='dark'|'normal'
export type MusicInstrumentFamily='piano'|'electric-piano'|'nylon-pluck'|'glass-fm'|'soft-synth'
export type MusicWaveArchetype='drift'|'swing'|'drive'|'pulse'|'syncopated'|'swell'|'groove'|'pluck'

export type MusicExpression={
  id:string
  label:string
  moodLabel:string
  seed:number
  valence:number
  arousal:number
  archetype:MusicWaveArchetype
  colors:Record<MusicLayerName,string>
  baseColor:string
  glowColor:string
  motion:{
    amplitude:number
    speed:number
    phaseSpread:number
    layerSpread:number
    stroke:number
    secondaryOpacity:number
    dominantOpacity:number
    glow:number
    density:number
    sharpness:number
    asymmetry:number
    pulse:number
  }
  instrumentHint:MusicInstrumentFamily
}

type PalettePreset={
  id:string
  label:string
  dark:[string,string,string,string,string,string]
  normal:[string,string,string,string,string,string]
}

const LAYERS:MusicLayerName[]=['bass','lowMid','mid','vocal','presence','air']

const PRESETS:Record<string,PalettePreset>={
  verdant:{id:'verdant',label:'Verdant signal',dark:['#55d6b7','#74cbae','#dce9e2','#efc57e','#86b5ff','#c8a4ff'],normal:['#257d69','#408f78','#627f70','#a26d2f','#486ea8','#75579d']},
  'classical-ivory':{id:'classical-ivory',label:'Ivory chamber',dark:['#8da59a','#b8b6a3','#f0e8d8','#d7b56f','#a6b9d8','#d8c7e8'],normal:['#536c62','#7a765f','#8b7959','#9f6e2c','#617798','#7b668c']},
  'classical-chamber':{id:'classical-chamber',label:'Chamber burgundy',dark:['#7e9a91','#b39a91','#e6ddd1','#c88a75','#8ca6c8','#b494b8'],normal:['#4f6f66','#7e5d55','#806c5a','#984f40','#516f99','#765476']},
  'jazz-smoke':{id:'jazz-smoke',label:'Smoky blue jazz',dark:['#4fb2a3','#7fa79a','#c6d5ce','#e0ad68','#729bce','#a58cc8'],normal:['#25796f','#55786e','#647c70','#9a6429','#456894','#69528e']},
  'jazz-burgundy':{id:'jazz-burgundy',label:'Burgundy brass',dark:['#769786','#af8a78','#d6c8b7','#e0a95e','#7f9ac5','#b080a0'],normal:['#506b5d','#7d5346','#77634f','#a26723','#506797','#7a4867']},
  'blues-indigo':{id:'blues-indigo',label:'Indigo blues',dark:['#4f9da2','#6a9ba7','#9eb4c8','#d19d71','#728ed0','#927bc3'],normal:['#2d6d73','#456d7b','#586f83','#955f38','#465f9a','#644c91']},
  'rock-ember':{id:'rock-ember',label:'Ember rock',dark:['#58a88f','#aa8b68','#d7c6ae','#e47d58','#7599d2','#b66f96'],normal:['#337461','#755c3c','#796b55','#a84a30','#496898','#804363']},
  'rock-electric':{id:'rock-electric',label:'Electric rock',dark:['#45c2a9','#6db0a0','#c7d6d0','#f09b62','#5e9fe8','#b279d8'],normal:['#177967','#3d786b','#5f796f','#ac5a2f','#326ca9','#7948a2']},
  'metal-iron':{id:'metal-iron',label:'Iron violet',dark:['#55958a','#858d8c','#c5c9c7','#d77c68','#7088c3','#a868a8'],normal:['#3c675f','#59615e','#606a65','#9b493a','#485c8c','#744673']},
  'pop-prism':{id:'pop-prism',label:'Prismatic pop',dark:['#53cfb3','#79cab1','#d7e3da','#f2ad72','#78a9f5','#c783e4'],normal:['#1f806b','#47836f','#667e70','#ae672d','#4774ad','#8a4ca5']},
  'pop-sunset':{id:'pop-sunset',label:'Pastel sunset',dark:['#6ec6ad','#9ab99b','#ddd2b8','#ef9f7e','#8f9fda','#cc8fc6'],normal:['#3c7a68','#607657','#81745a','#ad5d45','#5a669d','#8b5885']},
  'electronic-neon':{id:'electronic-neon',label:'Neon circuit',dark:['#2fe0c0','#5bd1c7','#9fe8e6','#ff91c8','#62a7ff','#bd78ff'],normal:['#087d6c','#16868a','#297d83','#ae4777','#276dad','#783ca9']},
  'synthwave-night':{id:'synthwave-night',label:'Synthwave dusk',dark:['#48c7b7','#6fb4c8','#b9d1e3','#ef72aa','#748bff','#b26cff'],normal:['#24766d','#3d6e7c','#566f82','#a43b69','#4a5fad','#733ba6']},
  'ambient-aurora':{id:'ambient-aurora',label:'Aurora ambient',dark:['#63cbb8','#82c8c0','#c8e4df','#bdd6b2','#85aee0','#b49cd8'],normal:['#397c6f','#4f7c76','#627e78','#6e865f','#516f9b','#735e91']},
  'lofi-dust':{id:'lofi-dust',label:'Lo-fi dust',dark:['#72a794','#a5a087','#cbbda7','#c18e67','#8192b3','#9a829e'],normal:['#507466','#756f59','#786b56','#8c5934','#59677d','#6f596e']},
  'hiphop-night':{id:'hiphop-night',label:'Night pulse',dark:['#4ea78f','#79977f','#b8bca8','#d79565','#6f91c8','#956db6'],normal:['#2b6d5e','#52694f','#66705e','#9c5e2f','#49648f','#65457e']},
  'soul-velvet':{id:'soul-velvet',label:'Velvet soul',dark:['#65b49b','#9ea080','#d9c8aa','#dc926c','#8e92c5','#b97fa7'],normal:['#3c7665','#6b6c50','#7d6b51','#9e5539','#5c6090','#7f4f6e']},
  'folk-earth':{id:'folk-earth',label:'Earth & string',dark:['#69b298','#9daa7f','#d5c9a8','#dda76e','#89a3bf','#a68ca8'],normal:['#3d745f','#6b7350','#796d4e','#9d692b','#5a7186','#715c72']},
  'country-gold':{id:'country-gold',label:'Open-road gold',dark:['#6bb39c','#9cac82','#d8c99f','#e0ad5f','#8da4bd','#a987a1'],normal:['#3e7764','#6a744f','#7d6d45','#a66c1e','#5f7387','#74576a']},
  'latin-coral':{id:'latin-coral',label:'Coral rhythm',dark:['#4cc5a4','#83bb91','#d7d29c','#ef875f','#72a4d2','#c478a2'],normal:['#1e7a62','#4e7952','#797744','#ad4c31','#456f98','#864866']},
  'reggae-sun':{id:'reggae-sun',label:'Sunlit dub',dark:['#49bd91','#8fbd72','#d5cb7c','#e9a854','#6f9abb','#a68291'],normal:['#1e7655','#5d7b3f','#7a7134','#a66a1d','#4b6c84','#725969']},
  'soundtrack-cinematic':{id:'soundtrack-cinematic',label:'Cinematic horizon',dark:['#61aaa3','#829baa','#c1cad0','#d7aa78','#8294d0','#a886ca'],normal:['#3e706c','#566b79','#647580','#9b682f','#566393','#715394']},
  'newage-opal':{id:'newage-opal',label:'Opal drift',dark:['#76c8b7','#9ccfc4','#d7e6df','#cbd7b0','#9aaee0','#c4aadd'],normal:['#477c70','#628078','#71847a','#7a865f','#63729c','#806b95']},
  'vietnamese-silk':{id:'vietnamese-silk',label:'Silk & amber',dark:['#68b199','#9aa685','#d9c8aa','#dfaa72','#829cbc','#b389a8'],normal:['#3c7462','#687052','#7c6b50','#a06a2f','#556d88','#795a71']},
  'acoustic-wood':{id:'acoustic-wood',label:'Acoustic wood',dark:['#6ab39a','#a0a07a','#d4c3a0','#dfa36a','#86a0bc','#a48c9e'],normal:['#3f765f','#706b47','#7b684d','#a16328','#587087','#715e6d']},
  'easy-pastel':{id:'easy-pastel',label:'Easy pastel',dark:['#72c0ad','#9abca5','#d9d7c5','#e3b28b','#91aad0','#b69dc7'],normal:['#47796c','#637866','#7c7968','#9f7046','#607497','#785f88']},
  'dream-haze':{id:'dream-haze',label:'Dream haze',dark:['#68c1b4','#8db4c4','#c7d7dc','#c29fca','#8c9ee3','#c38ee1'],normal:['#3b756d','#587080','#667783','#795b86','#59669d','#81539a']},
  'melancholy-blue':{id:'melancholy-blue',label:'Melancholy blue',dark:['#5aa9a2','#759aaa','#aebfca','#b99e8c','#768fcc','#9d86bd'],normal:['#396e69','#4e6874','#5f7380','#7b6556','#4e6094','#6c5789']},
  'romantic-rose':{id:'romantic-rose',label:'Rose glow',dark:['#68b8a6','#a79f91','#d8c9bf','#e49a93','#919bd0','#c185b9'],normal:['#407568','#71695b','#7f6d65','#a65b56','#606796','#835378']},
  'energetic-cyan':{id:'energetic-cyan',label:'Kinetic cyan',dark:['#31dfba','#5dd4b7','#a8e1d2','#f4a35f','#5da7ff','#b06cff'],normal:['#087b64','#1a846b','#397c70','#b05f28','#246daf','#7138ac']},
  'dark-violet':{id:'dark-violet',label:'Nocturne violet',dark:['#4f958e','#6e878f','#a9afb9','#b47d86','#687fc1','#9869b9'],normal:['#356660','#4b5e64','#5b646e','#7d4c53','#46578c','#68447f']},
  'warm-sage':{id:'warm-sage',label:'Warm sage',dark:['#69b799','#9db185','#d8d0b3','#dda66f','#8da4c3','#aa90ad'],normal:['#3c775f','#697551','#7b7256','#9d652c','#5e728c','#735e77']},
  'chill-mist':{id:'chill-mist',label:'Chill mist',dark:['#6bbeb2','#8eb9b4','#c8dbd6','#c4bea1','#8da6ce','#aa98c3'],normal:['#43776f','#5b7470','#697a75','#79725b','#5d7194','#705f85']},
  'playful-citrus':{id:'playful-citrus',label:'Playful citrus',dark:['#46ceb0','#91c979','#ded27b','#efa458','#6fa9dd','#bc7ec4'],normal:['#177c65','#5a813f','#807635','#ad6124','#46749d','#814e85']},
}
function hash(value:string) {
  let h=2166136261
  for (let i=0;i<value.length;i+=1) {
    h^=value.charCodeAt(i)
    h=Math.imul(h,16777619)
  }
  return h>>>0
}

function clamp(value:number,min=0,max=1) {
  return Math.max(min,Math.min(max,value))
}

function hexRgb(hex:string) {
  const clean=hex.replace('#','')
  return [
    Number.parseInt(clean.slice(0,2),16),
    Number.parseInt(clean.slice(2,4),16),
    Number.parseInt(clean.slice(4,6),16),
  ] as const
}

function blendHex(a:string,b:string,amount:number) {
  const x=hexRgb(a), y=hexRgb(b), t=clamp(amount)
  const channel=(index:number)=>Math.round(x[index]*(1-t)+y[index]*t).toString(16).padStart(2,'0')
  return '#'+channel(0)+channel(1)+channel(2)
}

function rgbHsl(hex:string) {
  const [rr,gg,bb]=hexRgb(hex).map(value=>value/255)
  const max=Math.max(rr,gg,bb),min=Math.min(rr,gg,bb)
  const light=(max+min)/2
  const delta=max-min
  if(delta===0) return {h:0,s:0,l:light}
  const saturation=delta/(1-Math.abs(2*light-1))
  let hue=max===rr ? ((gg-bb)/delta)%6
    : max===gg ? (bb-rr)/delta+2
    : (rr-gg)/delta+4
  hue*=60
  if(hue<0) hue+=360
  return {h:hue,s:saturation,l:light}
}

function hslHex(h:number,s:number,l:number) {
  const hue=((h%360)+360)%360
  const saturation=clamp(s)
  const light=clamp(l)
  const c=(1-Math.abs(2*light-1))*saturation
  const x=c*(1-Math.abs((hue/60)%2-1))
  const m=light-c/2
  let rgb:[number,number,number]
  if(hue<60) rgb=[c,x,0]
  else if(hue<120) rgb=[x,c,0]
  else if(hue<180) rgb=[0,c,x]
  else if(hue<240) rgb=[0,x,c]
  else if(hue<300) rgb=[x,0,c]
  else rgb=[c,0,x]
  return '#'+rgb.map(value=>Math.round((value+m)*255).toString(16).padStart(2,'0')).join('')
}

function relativeLuminance(hex:string) {
  const [r,g,b]=hexRgb(hex).map(value=>{
    const channel=value/255
    return channel<=.03928?channel/12.92:Math.pow((channel+.055)/1.055,2.4)
  })
  return r*.2126+g*.7152+b*.0722
}

function contrastRatio(a:string,b:string) {
  const left=relativeLuminance(a),right=relativeLuminance(b)
  const high=Math.max(left,right),low=Math.min(left,right)
  return (high+.05)/(low+.05)
}

function contrastSafeColor(h:number,s:number,l:number,theme:MusicTheme) {
  const background=theme==='normal'?'#f7faf6':'#080c0a'
  const target=theme==='normal'?3.1:4.6
  let light=l
  let color=hslHex(h,s,light)
  let attempts=0
  while(contrastRatio(color,background)<target&&attempts<28){
    light=theme==='normal'
      ? Math.max(.14,light-.012)
      : Math.min(.82,light+.012)
    color=hslHex(h,s,light)
    attempts+=1
  }
  return color
}

function hueDistance(a:number,b:number) {
  const diff=Math.abs(a-b)%360
  return Math.min(diff,360-diff)
}

function vividPalette(colors:string[],theme:MusicTheme,seed:number) {
  const source=colors.map(rgbHsl)
  const anchor=source.find(item=>item.s>=.2)?.h ?? seed%360
  const fallbackOffsets=[0,32,68,18,205,278]
  const resolvedHues:number[]=[]
  return source.map((item,index)=>{
    let hue=item.s<.18?(anchor+fallbackOffsets[index])%360:item.h
    let attempts=0
    while(resolvedHues.some(previous=>hueDistance(previous,hue)<16)&&attempts<6){
      hue=(hue+19+index*7)%360
      attempts+=1
    }
    resolvedHues.push(hue)
    const saturation=Math.max(item.s,theme==='normal'?.92:.84)
    const light=theme==='normal'
      ? clamp(item.l,.30,.40)
      : clamp(item.l,.56,.66)
    return contrastSafeColor(hue,saturation,light,theme)
  })
}

function normalize(value:string|null|undefined) {
  return (value??'').trim().toLowerCase()
}

function contains(value:string,terms:string[]) {
  return terms.some(term=>value.includes(term))
}

function semanticEnergy(state:MusicCortexState) {
  const source=[
    state.genre,
    state.style,
    state.arrangement,
    state.texture,
    state.mood,
  ].filter(Boolean).join(' ').toLowerCase()

  let energy=.34
  if (contains(source,['metal','punk','hard-rock','garage-rock','drum-and-bass','dubstep','techno'])) energy=.8
  else if (contains(source,['rock','grunge','electronic','house','trance','synthwave','dance-pop'])) energy=.68
  else if (contains(source,['latin','salsa','samba','reggae','funk','hip-hop','rap','swing'])) energy=.58
  else if (contains(source,['pop','jazz','blues','country','folk-rock'])) energy=.48
  else if (contains(source,['easy-listening','adult-contemporary','soft-rock','singer-songwriter','acoustic','ballad'])) energy=.34
  else if (contains(source,['ambient','new-age','classical','chamber','minimalism','lofi','chill'])) energy=.24

  if (contains(source,['energetic','upbeat','alive','intense'])) energy+=.16
  if (contains(source,['calm','dream','intimate','melanch','sad','chill'])) energy-=.1
  return clamp(energy,.16,.92)
}

function waveArchetype(state:MusicCortexState):MusicWaveArchetype {
  const source=[
    state.genre,
    state.style,
    state.arrangement,
    state.texture,
  ].filter(Boolean).join(' ').toLowerCase()

  if (contains(source,['shoegaze','dream-pop'])) return 'drift'
  if (contains(source,['post-rock','cinematic'])) return 'swell'
  if (contains(source,['soft-rock','pop-rock'])) return 'pulse'
  if (contains(source,['jazz','swing','blues','bossa-nova'])) return 'swing'
  if (contains(source,['metal','punk','hard-rock','grunge','garage-rock','post-punk','rock'])) return 'drive'
  if (contains(source,['electronic','house','techno','trance','synthwave','electropop','synthpop','dance-pop'])) return 'pulse'
  if (contains(source,['latin','salsa','samba','reggae','dub','funk','bachata'])) return 'syncopated'
  if (contains(source,['hip-hop','rap','trap','drill','boom-bap','rnb','r&b','soul'])) return 'groove'
  if (contains(source,['classical','orchestral','chamber','soundtrack','cinematic','neo-classical','minimalism'])) return 'swell'
  if (contains(source,['acoustic','singer-songwriter','folk','country','guitar','bluegrass'])) return 'pluck'
  if (contains(source,['ambient','new-age','dream-pop','shoegaze','lofi','downtempo'])) return 'drift'
  return 'pulse'
}

function archetypeMotion(archetype:MusicWaveArchetype) {
  switch(archetype){
    case 'drift': return {density:.72,sharpness:.12,asymmetry:.18,pulse:.18}
    case 'swing': return {density:1.08,sharpness:.24,asymmetry:.68,pulse:.42}
    case 'drive': return {density:1.42,sharpness:.82,asymmetry:.34,pulse:.74}
    case 'pulse': return {density:1.18,sharpness:.46,asymmetry:.2,pulse:.78}
    case 'syncopated': return {density:1.3,sharpness:.5,asymmetry:.76,pulse:.9}
    case 'swell': return {density:.82,sharpness:.18,asymmetry:.28,pulse:.34}
    case 'groove': return {density:1.14,sharpness:.38,asymmetry:.58,pulse:.82}
    case 'pluck': return {density:1.02,sharpness:.62,asymmetry:.44,pulse:.56}
  }
}

function basePreset(state:MusicCortexState,seed:number) {
  const genre=normalize(state.genre)
  const style=normalize(state.style)
  const texture=normalize(state.texture)
  const source=genre+' '+style+' '+texture

  let choices=['verdant']
  if (contains(source,['classical','baroque','orchestral','chamber','neo-classical','minimalism'])) choices=['classical-ivory','classical-chamber']
  else if (contains(source,['jazz','swing','bebop','bop'])) choices=['jazz-smoke','jazz-burgundy']
  else if (contains(source,['blues'])) choices=['blues-indigo','jazz-smoke']
  else if (contains(source,['metal'])) choices=['metal-iron','dark-violet']
  else if (contains(source,['rock','grunge','punk'])) choices=contains(source,['soft-rock','pop-rock'])?['rock-ember','easy-pastel']:['rock-ember','rock-electric']
  else if (contains(source,['ambient','downtempo','new-age'])) choices=['ambient-aurora','newage-opal']
  else if (contains(source,['lofi','lo-fi','chillhop','trip-hop'])) choices=['lofi-dust','chill-mist']
  else if (contains(source,['synthwave','electronic','house','techno','trance','electropop','synthpop'])) choices=['electronic-neon','synthwave-night']
  else if (contains(source,['hip-hop','rap','trap','drill','boom-bap'])) choices=['hiphop-night','lofi-dust']
  else if (contains(source,['rnb','r&b','soul','funk','gospel'])) choices=['soul-velvet','jazz-burgundy']
  else if (contains(source,['folk','singer-songwriter','bluegrass'])) choices=['folk-earth','acoustic-wood']
  else if (contains(source,['country'])) choices=['country-gold','folk-earth']
  else if (contains(source,['latin','bossa','samba','salsa','bachata','flamenco','bolero'])) choices=['latin-coral','acoustic-wood']
  else if (contains(source,['reggae','dub','ska'])) choices=['reggae-sun','warm-sage']
  else if (contains(source,['soundtrack','cinematic','film score'])) choices=['soundtrack-cinematic','classical-chamber']
  else if (contains(source,['vietnamese','nhac','v-pop','cai-luong','vong-co','dan-ca','quan-ho'])) choices=['vietnamese-silk','warm-sage']
  else if (contains(source,['acoustic','guitar','piano'])) choices=['acoustic-wood','easy-pastel']
  else if (contains(source,['easy-listening','adult-contemporary','ballad'])) choices=['easy-pastel','warm-sage']
  else if (contains(source,['dream-pop','shoegaze'])) choices=['dream-haze','ambient-aurora']
  else if (contains(source,['pop'])) choices=['pop-prism','pop-sunset']

  return PRESETS[choices[seed%choices.length]] ?? PRESETS.verdant
}

function moodPreset(mood:string,seed:number) {
  const value=normalize(mood)
  let choices:string[]=[]
  if (contains(value,['melanch','sad','sorrow'])) choices=['melancholy-blue','dark-violet']
  else if (contains(value,['romantic','love','intimate'])) choices=['romantic-rose','warm-sage']
  else if (contains(value,['dream','ethereal'])) choices=['dream-haze','ambient-aurora']
  else if (contains(value,['energetic','upbeat','alive','intense'])) choices=['energetic-cyan','playful-citrus']
  else if (contains(value,['dark','brooding','tense'])) choices=['dark-violet','metal-iron']
  else if (contains(value,['warm'])) choices=['warm-sage','easy-pastel']
  else if (contains(value,['chill','calm','relax','peace'])) choices=['chill-mist','ambient-aurora']
  else if (contains(value,['playful','bright','happy'])) choices=['playful-citrus','pop-prism']
  return choices.length ? PRESETS[choices[(seed>>>3)%choices.length]] : null
}

export function estimateMusicValence(mood:string) {
  const value=normalize(mood)
  if (contains(value,['happy','bright','playful','romantic','warm','energetic','upbeat'])) return .74
  if (contains(value,['melanch','sad','dark','brooding','tense'])) return .28
  if (contains(value,['calm','chill','dream','intimate'])) return .55
  return .5
}

function instrumentHint(state:MusicCortexState,seed:number):MusicInstrumentFamily {
  const source=normalize(state.genre)+' '+normalize(state.style)+' '+normalize(state.texture)+' '+normalize(state.mood)
  const choices:MusicInstrumentFamily[]=
    contains(source,['acoustic','guitar','folk','country','bossa','singer-songwriter'])
      ? ['nylon-pluck','piano']
      : contains(source,['jazz','soul','rnb','easy-listening','adult-contemporary'])
        ? ['electric-piano','piano','glass-fm']
        : contains(source,['ambient','dream','new-age','electronic','synth'])
          ? ['glass-fm','soft-synth','electric-piano']
          : contains(source,['classical','piano','ballad'])
            ? ['piano','electric-piano']
            : ['soft-synth','electric-piano','nylon-pluck']
  return choices[(seed>>>5)%choices.length]
}
export function musicExpressionSeed(state:MusicCortexState) {
  if (state.composition?.seed) return state.composition.seed>>>0
  const identity=state.track
    ? state.track.artist+'|'+state.track.title
    : [state.genre,state.style,state.mood,state.texture,state.mode].join('|')
  return hash(identity)
}

export function resolveMusicExpression(state:MusicCortexState,theme:MusicTheme):MusicExpression {
  const seed=musicExpressionSeed(state)
  const base=basePreset(state,seed)
  const mood=moodPreset(state.mood,seed)
  const palette=theme==='normal'?base.normal:base.dark
  const effectiveMood=mood?.id===base.id?null:mood
  const effectiveMoodColors=effectiveMood?(theme==='normal'?effectiveMood.normal:effectiveMood.dark):null
  const moodBlend=effectiveMoodColors?clamp(.14+state.confidence*.12,.14,.28):0
  const blended=palette.map((color,index)=>effectiveMoodColors?blendHex(color,effectiveMoodColors[index],moodBlend):color)
  const colors=vividPalette(blended,theme,seed)

  // Seeded improvisation: preserve the palette identity, but occasionally exchange
  // neighbouring upper layers so repeat visits are not perfectly mechanical.
  if ((seed&3)===1) [colors[4],colors[5]]=[colors[5],colors[4]]
  if ((seed&7)===3) [colors[1],colors[2]]=[colors[2],colors[1]]

  const valence=estimateMusicValence(state.mood)
  const semanticPrior=semanticEnergy(state)
  const liveEnergy=clamp(state.energy*2.15,0,1)
  const energy=state.signal==='dsp' || state.mode==='humming'
    ? liveEnergy
    : semanticPrior
  const arousal=clamp(.1+energy*.78+(1-Math.abs(valence-.5)*2)*.06,0,1)
  const calm=contains(normalize(state.mood),['calm','chill','relax','dream','intimate'])
  const intense=contains(normalize(state.mood),['energetic','intense','upbeat','dark'])
  const humming=state.mode==='humming'
  const archetype=state.mode==='humming'&&state.composition
    ? state.composition.instrument==='nylon-pluck'?'pluck'
      : state.composition.instrument==='glass-fm'?'drift'
      : state.composition.swing>.24?'swing'
      : 'swell'
    : waveArchetype(state)
  const grammar=archetypeMotion(archetype)

  const motion={
    amplitude:clamp(.72+energy*1.04+(humming?.14:0)+(intense?.16:0)-(calm?.1:0),.56,2.05),
    speed:clamp(.58+energy*.94+(intense?.18:0)-(calm?.1:0),.42,1.9),
    phaseSpread:clamp(.68+energy*.74+(seed%17)/45,.58,1.8),
    layerSpread:clamp(.86+energy*.54+(humming?.12:0),.8,1.7),
    stroke:clamp(1.08+state.confidence*.3+energy*.28,1.05,1.7),
    secondaryOpacity:theme==='normal'
      ? clamp(.8+state.confidence*.06+energy*.06,.78,.94)
      : clamp(.74+state.confidence*.08+energy*.08,.72,.94),
    dominantOpacity:1,
    glow:theme==='normal'
      ? clamp(.08+energy*.12,.08,.22)
      : clamp(.18+energy*.2,.16,.4),
    density:grammar.density,
    sharpness:grammar.sharpness,
    asymmetry:grammar.asymmetry,
    pulse:grammar.pulse,
  }

  return {
    id:base.id+(effectiveMood?'+':'')+(effectiveMood?.id??'')+'@'+archetype,
    label:effectiveMood?base.label+' / '+effectiveMood.label:base.label,
    moodLabel:state.mood,
    seed,
    valence,
    arousal,
    archetype,
    colors:Object.fromEntries(LAYERS.map((layer,index)=>[layer,colors[index]])) as Record<MusicLayerName,string>,
    baseColor:colors[1],
    glowColor:colors[state.dominantLayer==='bass'?0:state.dominantLayer==='lowMid'?1:state.dominantLayer==='mid'?2:state.dominantLayer==='vocal'?3:state.dominantLayer==='presence'?4:5],
    motion,
    instrumentHint:state.composition?.instrument ?? instrumentHint(state,seed),
  }
}

export function blendMusicMotion(from:MusicExpression['motion'],to:MusicExpression['motion'],amount:number) {
  const t=clamp(amount)
  const lerp=(a:number,b:number)=>a+(b-a)*t
  return {
    amplitude:lerp(from.amplitude,to.amplitude),
    speed:lerp(from.speed,to.speed),
    phaseSpread:lerp(from.phaseSpread,to.phaseSpread),
    layerSpread:lerp(from.layerSpread,to.layerSpread),
    stroke:lerp(from.stroke,to.stroke),
    secondaryOpacity:lerp(from.secondaryOpacity,to.secondaryOpacity),
    dominantOpacity:lerp(from.dominantOpacity,to.dominantOpacity),
    glow:lerp(from.glow,to.glow),
    density:lerp(from.density,to.density),
    sharpness:lerp(from.sharpness,to.sharpness),
    asymmetry:lerp(from.asymmetry,to.asymmetry),
    pulse:lerp(from.pulse,to.pulse),
  }
}
