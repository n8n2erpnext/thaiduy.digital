import { resolveMusicExpression } from '../src/lib/music-expression'
import { restingMusicState, type MusicCortexState } from '../src/lib/music-state'

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
  ['latin','bossa-nova','warm'],
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

function stateFor(genre:string,style:string,mood:string):MusicCortexState {
  return {
    ...restingMusicState,
    mode:'listening',
    connected:true,
    signal:'semantic',
    genre,
    style,
    mood,
    energy:.3,
    confidence:.8,
    texture:'mixed',
    track:{artist:'Expression QA',title:style,url:''},
  }
}

let normalMin=Infinity
let darkMin=Infinity
let normalOpacity=Infinity
let darkOpacity=Infinity

for(const [genre,style,mood] of CASES){
  const state=stateFor(genre,style,mood)
  for(const theme of ['normal','dark'] as const){
    const expression=resolveMusicExpression(state,theme)
    const colors=Object.values(expression.colors)
    if(new Set(colors).size<5){
      throw new Error('Palette collapsed for '+genre+'/'+style+'/'+mood+' '+theme)
    }

    const background=theme==='normal'?'#f7faf6':'#080c0a'
    const localMin=Math.min(...colors.map(color=>contrast(color,background)))
    if(theme==='normal'){
      normalMin=Math.min(normalMin,localMin)
      normalOpacity=Math.min(normalOpacity,expression.motion.secondaryOpacity)
    }else{
      darkMin=Math.min(darkMin,localMin)
      darkOpacity=Math.min(darkOpacity,expression.motion.secondaryOpacity)
    }
  }
}

console.log('Music expression audit')
console.log('- representative states:',CASES.length)
console.log('- normal min contrast:',normalMin.toFixed(2))
console.log('- dark min contrast:',darkMin.toFixed(2))
console.log('- normal secondary opacity:',normalOpacity.toFixed(2))
console.log('- dark secondary opacity:',darkOpacity.toFixed(2))

if(normalMin<3.25) throw new Error('Normal-mode wave contrast fell below 3.25')
if(darkMin<4.25) throw new Error('Dark-mode wave contrast fell below 4.25')
if(normalOpacity<.68) throw new Error('Normal-mode secondary wave opacity fell below .68')
if(darkOpacity<.62) throw new Error('Dark-mode secondary wave opacity fell below .62')

console.log('MUSIC EXPRESSION PASS')
