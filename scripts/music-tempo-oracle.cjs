'use strict'

const MusicTempo=require('music-tempo')

const INPUT_SAMPLE_RATE=48000
const OUTPUT_SAMPLE_RATE=44100
const CHANNELS=2

function median(values){
  if(!values.length)return 0
  const a=[...values].sort((x,y)=>x-y)
  const m=Math.floor(a.length/2)
  return a.length%2?a[m]:(a[m-1]+a[m])/2
}

function clamp01(v){return Math.max(0,Math.min(1,v))}

function resampleStereoPcm16ToMonoFloat32(buffer){
  const frames=Math.floor(buffer.length/(CHANNELS*2))
  const outFrames=Math.max(1,Math.floor(frames*OUTPUT_SAMPLE_RATE/INPUT_SAMPLE_RATE))
  const out=new Float32Array(outFrames)
  const step=INPUT_SAMPLE_RATE/OUTPUT_SAMPLE_RATE
  for(let i=0;i<outFrames;i++){
    const pos=i*step
    const a=Math.min(frames-1,Math.floor(pos))
    const b=Math.min(frames-1,a+1)
    const t=pos-a
    const aOff=a*4,bOff=b*4
    const aMono=(buffer.readInt16LE(aOff)+buffer.readInt16LE(aOff+2))/65536
    const bMono=(buffer.readInt16LE(bOff)+buffer.readInt16LE(bOff+2))/65536
    out[i]=aMono+(bMono-aMono)*t
  }
  return out
}

function analyze(buffer){
  const started=Date.now()
  const audio=resampleStereoPcm16ToMonoFloat32(buffer)
  const mt=new MusicTempo(audio,{
    maxBeatInterval:1.5,
    minBeatInterval:60/210,
  })
  const bpm=Number(mt.tempo)
  const beats=Array.isArray(mt.beats)
    ? mt.beats.map(Number).filter(Number.isFinite)
    : []
  const intervals=[]
  for(let i=1;i<beats.length;i++){
    const d=beats[i]-beats[i-1]
    if(d>0&&d<2)intervals.push(d)
  }
  const center=median(intervals)
  const mad=center
    ? median(intervals.map(value=>Math.abs(value-center)))
    : 1
  const regularity=center
    ? clamp01(1-mad/Math.max(.01,center*.14))
    : 0
  const coverage=clamp01(beats.length/12)
  const confidence=clamp01(regularity*.72+coverage*.28)
  return {
    bpm:Number.isFinite(bpm)?bpm:0,
    confidence,
    beatCount:beats.length,
    intervalMad:mad,
    analysisMs:Date.now()-started,
  }
}

let carry=Buffer.alloc(0)
let expected=null

process.stdin.on('data',chunk=>{
  carry=carry.length?Buffer.concat([carry,chunk]):Buffer.from(chunk)
  while(true){
    if(expected===null){
      if(carry.length<4)return
      expected=carry.readUInt32LE(0)
      carry=carry.subarray(4)
      if(expected<=0||expected>8_000_000){
        process.stdout.write(JSON.stringify({error:'invalid payload length'})+'\n')
        expected=null
        continue
      }
    }
    if(carry.length<expected)return
    const payload=Buffer.from(carry.subarray(0,expected))
    carry=carry.subarray(expected)
    expected=null
    try{
      process.stdout.write(JSON.stringify(analyze(payload))+'\n')
    }catch(error){
      process.stdout.write(JSON.stringify({error:String(error)})+'\n')
    }
  }
})
