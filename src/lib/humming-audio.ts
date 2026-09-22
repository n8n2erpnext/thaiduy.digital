import type { HummingComposition,HummingInstrument } from '@/lib/music-state'

const KEY_CLASS:Record<string,number>={
  C:0,'C♯':1,Db:1,D:2,'D♯':3,Eb:3,E:4,F:5,'F♯':6,Gb:6,G:7,'G♯':8,Ab:8,A:9,'A♯':10,Bb:10,B:11,
}

type PlaybackGraph={
  destination:AudioNode
  melody:GainNode
  pad:GainNode
  bass:GainNode
}

export type HummingPlaybackProfile={
  instrument:HummingInstrument
  instrumentLabel:string
  layers:2|3
  pad:string
  bass:string
  durationSeconds:number
}

export function midiFrequency(midi:number) {
  return 440*Math.pow(2,(midi-69)/12)
}

export function scoreDuration(composition:HummingComposition) {
  const beats=composition.meter==='3/4'?composition.bars*3:composition.bars*4
  return beats*60/composition.bpm
}

function fallbackInstrument(composition:HummingComposition):HummingInstrument {
  if (composition.voice==='whistle') return 'glass-fm'
  if (composition.voice==='breath') return 'nylon-pluck'
  if (composition.voice==='soft-synth') return 'soft-synth'
  return 'electric-piano'
}

function instrumentLabel(instrument:HummingInstrument) {
  switch(instrument) {
    case 'piano': return 'Piano'
    case 'electric-piano': return 'Electric piano'
    case 'nylon-pluck': return 'Nylon guitar'
    case 'glass-fm': return 'Glass FM'
    case 'soft-synth': return 'Soft synth'
  }
}

export function hummingPlaybackProfile(composition:HummingComposition):HummingPlaybackProfile {
  const instrument=composition.instrument??fallbackInstrument(composition)
  const ensemble=composition.ensemble??{
    pad:instrument==='glass-fm'?'air-pad':'warm-pad',
    bass:'none' as const,
    layers:2 as const,
  }
  return {
    instrument,
    instrumentLabel:instrumentLabel(instrument),
    layers:ensemble.layers,
    pad:ensemble.pad,
    bass:ensemble.bass,
    durationSeconds:scoreDuration(composition),
  }
}

function createOutputGraph(context:AudioContext):PlaybackGraph {
  const melody=context.createGain()
  const pad=context.createGain()
  const bass=context.createGain()
  const mix=context.createGain()
  const compressor=context.createDynamicsCompressor()
  const limiter=context.createDynamicsCompressor()
  const master=context.createGain()

  melody.gain.value=.92
  pad.gain.value=.58
  bass.gain.value=.52
  mix.gain.value=.88

  compressor.threshold.value=-22
  compressor.knee.value=16
  compressor.ratio.value=3.2
  compressor.attack.value=.008
  compressor.release.value=.24

  limiter.threshold.value=-5
  limiter.knee.value=0
  limiter.ratio.value=16
  limiter.attack.value=.002
  limiter.release.value=.08

  master.gain.value=.9

  melody.connect(mix)
  pad.connect(mix)
  bass.connect(mix)
  mix.connect(compressor)
  compressor.connect(limiter)
  limiter.connect(master)
  master.connect(context.destination)

  return {destination:master,melody,pad,bass}
}

function swingOffset(beat:number,swing:number,secondsPerBeat:number) {
  const eighth=Math.round(beat*2)
  return eighth%2===1?swing*.22*secondsPerBeat:0
}

function envelope(
  gain:GainNode,
  start:number,
  peak:number,
  attack:number,
  releaseAt:number,
  end:number,
) {
  gain.gain.cancelScheduledValues(start)
  gain.gain.setValueAtTime(.0001,start)
  gain.gain.exponentialRampToValueAtTime(Math.max(.001,peak),start+attack)
  gain.gain.setValueAtTime(Math.max(.001,peak*.72),Math.max(start+attack+.001,releaseAt))
  gain.gain.exponentialRampToValueAtTime(.0001,end)
}

function oscillator(
  context:AudioContext,
  destination:AudioNode,
  type:OscillatorType,
  frequency:number,
  start:number,
  end:number,
  detune=0,
) {
  const osc=context.createOscillator()
  osc.type=type
  osc.frequency.setValueAtTime(frequency,start)
  osc.detune.setValueAtTime(detune,start)
  osc.connect(destination)
  osc.start(start)
  osc.stop(end+.04)
  return osc
}
function schedulePiano(
  context:AudioContext,
  destination:AudioNode,
  frequency:number,
  start:number,
  length:number,
  velocity:number,
) {
  const gain=context.createGain()
  const end=start+Math.max(.12,length)
  envelope(gain,start,.105+velocity*.11,.008,start+length*.34,end)
  gain.connect(destination)

  oscillator(context,gain,'triangle',frequency,start,end)
  const partial=context.createGain()
  partial.gain.value=.22
  partial.connect(gain)
  oscillator(context,partial,'sine',frequency*2,start,end,-3)

  const high=context.createGain()
  high.gain.value=.07
  high.connect(gain)
  oscillator(context,high,'sine',frequency*3,start,Math.min(end,start+.42),4)
}

function scheduleElectricPiano(
  context:AudioContext,
  destination:AudioNode,
  frequency:number,
  start:number,
  length:number,
  velocity:number,
) {
  const gain=context.createGain()
  const end=start+Math.max(.16,length)
  envelope(gain,start,.09+velocity*.12,.014,start+length*.5,end)
  gain.connect(destination)

  const carrier=context.createOscillator()
  const mod=context.createOscillator()
  const modGain=context.createGain()
  carrier.type='sine'
  carrier.frequency.setValueAtTime(frequency,start)
  mod.type='sine'
  mod.frequency.setValueAtTime(frequency*2,start)
  modGain.gain.setValueAtTime(frequency*.24,start)
  modGain.gain.exponentialRampToValueAtTime(Math.max(2,frequency*.035),Math.min(end,start+.9))
  mod.connect(modGain).connect(carrier.frequency)
  carrier.connect(gain)
  carrier.start(start)
  mod.start(start)
  carrier.stop(end+.04)
  mod.stop(end+.04)

  const tine=context.createGain()
  tine.gain.value=.14
  tine.connect(gain)
  oscillator(context,tine,'sine',frequency*4,start,Math.min(end,start+.48),-5)
}

function scheduleNylonPluck(
  context:AudioContext,
  destination:AudioNode,
  frequency:number,
  start:number,
  length:number,
  velocity:number,
) {
  const filter=context.createBiquadFilter()
  filter.type='lowpass'
  filter.frequency.setValueAtTime(Math.min(5200,frequency*8),start)
  filter.frequency.exponentialRampToValueAtTime(Math.max(700,frequency*2.2),start+Math.min(.6,length))
  filter.Q.value=.65

  const gain=context.createGain()
  const end=start+Math.max(.1,Math.min(length,1.8))
  envelope(gain,start,.13+velocity*.13,.004,start+Math.min(.22,length*.28),end)
  filter.connect(gain).connect(destination)
  oscillator(context,filter,'triangle',frequency,start,end,-4)
  oscillator(context,filter,'sine',frequency*2,start,Math.min(end,start+.44),5)

  const frames=Math.max(1,Math.floor(context.sampleRate*.035))
  const buffer=context.createBuffer(1,frames,context.sampleRate)
  const data=buffer.getChannelData(0)
  for(let i=0;i<frames;i+=1) data[i]=(Math.random()*2-1)*.12
  const noise=context.createBufferSource()
  const noiseGain=context.createGain()
  noiseGain.gain.setValueAtTime(.018+velocity*.018,start)
  noiseGain.gain.exponentialRampToValueAtTime(.0001,start+.035)
  noise.buffer=buffer
  noise.connect(noiseGain).connect(filter)
  noise.start(start)
}

function scheduleGlassFm(
  context:AudioContext,
  destination:AudioNode,
  frequency:number,
  start:number,
  length:number,
  velocity:number,
) {
  const gain=context.createGain()
  const end=start+Math.max(.18,Math.min(length*1.2,2.4))
  envelope(gain,start,.075+velocity*.1,.012,start+Math.min(.7,length*.55),end)
  gain.connect(destination)

  const carrier=context.createOscillator()
  const mod=context.createOscillator()
  const modGain=context.createGain()
  carrier.type='sine'
  carrier.frequency.setValueAtTime(frequency,start)
  mod.type='sine'
  mod.frequency.setValueAtTime(frequency*3,start)
  modGain.gain.setValueAtTime(frequency*.36,start)
  modGain.gain.exponentialRampToValueAtTime(Math.max(2,frequency*.025),Math.min(end,start+1.1))
  mod.connect(modGain).connect(carrier.frequency)
  carrier.connect(gain)
  carrier.start(start)
  mod.start(start)
  carrier.stop(end+.05)
  mod.stop(end+.05)
}

function scheduleSoftSynth(
  context:AudioContext,
  destination:AudioNode,
  frequency:number,
  start:number,
  length:number,
  velocity:number,
) {
  const filter=context.createBiquadFilter()
  filter.type='lowpass'
  filter.Q.value=.8
  filter.frequency.setValueAtTime(Math.min(4200,frequency*5.5),start)
  filter.frequency.exponentialRampToValueAtTime(Math.max(650,frequency*1.9),start+Math.min(1.2,length))

  const gain=context.createGain()
  const end=start+Math.max(.16,length)
  envelope(gain,start,.07+velocity*.1,.045,start+length*.62,end)
  filter.connect(gain).connect(destination)
  oscillator(context,filter,'triangle',frequency,start,end,-5)
  const body=context.createGain()
  body.gain.value=.22
  body.connect(filter)
  oscillator(context,body,'sawtooth',frequency,start,end,6)
}

function scheduleMelodyNote(
  context:AudioContext,
  destination:AudioNode,
  instrument:HummingInstrument,
  frequency:number,
  start:number,
  length:number,
  velocity:number,
) {
  if (instrument==='piano') return schedulePiano(context,destination,frequency,start,length,velocity)
  if (instrument==='electric-piano') return scheduleElectricPiano(context,destination,frequency,start,length,velocity)
  if (instrument==='nylon-pluck') return scheduleNylonPluck(context,destination,frequency,start,length,velocity)
  if (instrument==='glass-fm') return scheduleGlassFm(context,destination,frequency,start,length,velocity)
  return scheduleSoftSynth(context,destination,frequency,start,length,velocity)
}
function chordRootOffset(symbol:string,mode:string) {
  const minor=/minor|dorian/.test(mode)
  if (symbol.includes('♭VII')) return 10
  if (/^VII/.test(symbol)) return minor?10:11
  if (/^VI/.test(symbol)) return minor?8:9
  if (/^V/.test(symbol)) return 7
  if (/^IV/.test(symbol)) return 5
  if (/^III/.test(symbol)) return minor?3:4
  if (/^ii/i.test(symbol)) return 2
  return 0
}

function chordIntervals(symbol:string,mode:string) {
  const lower=symbol===symbol.toLowerCase() || /^ii/.test(symbol)
  const minorMode=/minor|dorian/.test(mode)
  const minor=lower || (symbol==='i' && minorMode)
  return minor?[0,3,7]:[0,4,7]
}

function rootMidi(composition:HummingComposition,octave=4) {
  return 12*(octave+1)+(KEY_CLASS[composition.key]??0)
}

function schedulePadChord(
  context:AudioContext,
  destination:AudioNode,
  midis:number[],
  start:number,
  length:number,
  airy:boolean,
) {
  const filter=context.createBiquadFilter()
  filter.type='lowpass'
  filter.frequency.value=airy?2500:1650
  filter.Q.value=.45
  const bus=context.createGain()
  const end=start+length
  bus.gain.setValueAtTime(.0001,start)
  bus.gain.exponentialRampToValueAtTime(airy?.038:.048,start+Math.min(.42,length*.22))
  bus.gain.setValueAtTime(airy?.034:.043,Math.max(start+.44,end-.42))
  bus.gain.exponentialRampToValueAtTime(.0001,end)
  bus.connect(filter).connect(destination)

  midis.forEach((midi,index)=>{
    const voice=context.createGain()
    voice.gain.value=index===0?1:.82
    voice.connect(bus)
    oscillator(context,voice,airy?'sine':'triangle',midiFrequency(midi),start,end,index===1?-5:index===2?4:0)
  })
}

function scheduleBassNote(
  context:AudioContext,
  destination:AudioNode,
  midi:number,
  start:number,
  length:number,
  sub:boolean,
) {
  const filter=context.createBiquadFilter()
  filter.type='lowpass'
  filter.frequency.value=sub?280:420
  const gain=context.createGain()
  const end=start+Math.max(.25,length)
  envelope(gain,start,sub?.085:.07,.018,start+length*.5,end)
  filter.connect(gain).connect(destination)
  oscillator(context,filter,'sine',midiFrequency(midi),start,end)
  if(!sub){
    const body=context.createGain()
    body.gain.value=.15
    body.connect(filter)
    oscillator(context,body,'triangle',midiFrequency(midi)*2,start,end,-4)
  }
}

export function scheduleHummingComposition(
  context:AudioContext,
  composition:HummingComposition,
  base=context.currentTime+.06,
):HummingPlaybackProfile {
  const profile=hummingPlaybackProfile(composition)
  const graph=createOutputGraph(context)
  const secondsPerBeat=60/composition.bpm
  const beatsPerBar=composition.meter==='3/4'?3:4
  const barSeconds=beatsPerBar*secondsPerBeat
  const root=rootMidi(composition,4)

  composition.notes.forEach(note=>{
    const start=base+note.beat*secondsPerBeat+swingOffset(note.beat,composition.swing,secondsPerBeat)
    const length=Math.max(.11,note.duration*secondsPerBeat*.93)
    scheduleMelodyNote(
      context,
      graph.melody,
      profile.instrument,
      midiFrequency(note.midi),
      start,
      length,
      note.velocity,
    )
  })

  composition.chordProgression.forEach((symbol,index)=>{
    const chordRoot=root+chordRootOffset(symbol,composition.mode)
    const chord=chordIntervals(symbol,composition.mode).map(interval=>chordRoot+interval)
    const start=base+index*barSeconds
    schedulePadChord(
      context,
      graph.pad,
      chord,
      start,
      barSeconds*.97,
      profile.pad==='air-pad',
    )

    if(profile.layers===3 && profile.bass!=='none'){
      let bassMidi=chordRoot-24
      while(bassMidi<32) bassMidi+=12
      scheduleBassNote(
        context,
        graph.bass,
        bassMidi,
        start,
        Math.min(barSeconds*.75,1.7),
        profile.bass==='sub-bass',
      )
      if(beatsPerBar===4){
        scheduleBassNote(
          context,
          graph.bass,
          bassMidi,
          start+barSeconds*.5,
          Math.min(barSeconds*.3,.75),
          profile.bass==='sub-bass',
        )
      }
    }
  })

  return profile
}
