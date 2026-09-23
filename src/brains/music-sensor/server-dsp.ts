export type TempoFamilyCandidate = {
  bpm:number
  score:number
  support:number
}

export type ServerDspFeatures = {
  rms:number; peak:number; bass:number; lowMid:number; mid:number; presence:number; air:number
  spectralFlux:number; spectralCentroid:number; spectralFlatness:number; zeroCrossingRate:number
  tempoBpm:number; tempoAutocorrBpm:number; tempoOnsetBpm:number; tempoReliable:boolean
  tempoSource:'autocorr'|'onset'|'blend'|'unknown'
  tempoAutocorrConfidence:number; tempoOnsetConfidence:number; processIntervalMs:number
  beatConfidence:number; meter:'2/4'|'3/4'|'4/4'|'6/8'|'12/8'|'unknown'
  meterCorr2:number; meterCorr3:number; meterCorr4:number
  meterAccent2:number; meterAccent3:number; meterAccent4:number; meterConfidence:number
  meterBeatLag:number; meterOppositeAsymmetry4:number
  subdivisionSimple:number; subdivisionTriplet:number; swingness:number
  percussiveProbability:number; harmonicProbability:number; dynamicRange:number
  rawLeftRmsDbfs:number; rawRightRmsDbfs:number; rawMonoRmsDbfs:number
  rawPeakDbfs:number; rawClipFraction:number; stereoCorrelation:number; monoCancellationRatio:number
  tempoCandidates:TempoFamilyCandidate[]
}

const clamp=(v:number,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v))
const median=(xs:number[])=>{
  if(!xs.length) return 0
  const a=[...xs].sort((x,y)=>x-y), m=Math.floor(a.length/2)
  return a.length%2?a[m]:(a[m-1]+a[m])/2
}
const db20=(v:number)=>20*Math.log10(v+1e-9)

export class ServerDspEngine {
  readonly sampleRate:number
  readonly fftSize:number
  private previousSpectrum:Float64Array
  private onsetHistory=new Float64Array(160)
  private energyHistory=new Float64Array(160)
  private historyCount=0
  private historyIndex=0
  private rhythmOnsetHistory=new Float64Array(512)
  private rhythmEnergyHistory=new Float64Array(512)
  private rhythmHistoryCount=0
  private rhythmHistoryIndex=0
  private previousRhythmEnergy=0
  private fluxBaseline=0
  private processCount=0

  private tempoBpm=0
  private tempoAutocorrBpm=0
  private tempoOnsetBpm=0
  private tempoReliable=false
  private tempoSource:'autocorr'|'onset'|'blend'|'unknown'='unknown'
  private tempoAutocorrConfidence=0
  private tempoOnsetConfidence=0
  private tempoAutocorrHistory=new Float64Array(8)
  private tempoOnsetHistory=new Float64Array(8)
  private tempoAutocorrConfidenceHistory=new Float64Array(8)
  private tempoOnsetConfidenceHistory=new Float64Array(8)
  private tempoHistoryCount=0
  private tempoHistoryIndex=0
  private pendingTempoBpm=0
  private pendingTempoCount=0
  private tempoReliabilityHold=0

  private latestPercussive=0
  private latestHarmonic=0
  private beatConfidence=0
  private meter:'2/4'|'3/4'|'4/4'|'6/8'|'12/8'|'unknown'='unknown'
  private meterCorr2=0
  private meterCorr3=0
  private meterCorr4=0
  private meterAccent2=0
  private meterAccent3=0
  private meterAccent4=0
  private meterConfidence=0
  private meterBeatLag=0
  private meterOppositeAsymmetry4=0
  private subdivisionSimple=0
  private subdivisionTriplet=0
  private swingness=0
  private tempoCandidates:TempoFamilyCandidate[]=[]

  constructor(sampleRate=48000,fftSize=4096){
    this.sampleRate=sampleRate
    this.fftSize=fftSize
    this.previousSpectrum=new Float64Array(fftSize/2+1)
  }

  process(interleaved:Int16Array,channels=2):ServerDspFeatures {
    const frames=Math.min(Math.floor(interleaved.length/channels),this.fftSize)
    const re=new Float64Array(this.fftSize)
    const im=new Float64Array(this.fftSize)
    const rhythmSums=new Float64Array(4)
    const rhythmCounts=new Int32Array(4)
    let monoSq=0,leftSq=0,rightSq=0,cross=0,peak=0,clips=0,zcr=0,prev=0

    for(let i=0;i<frames;i++){
      const l=interleaved[i*channels]/32768
      const r=channels>1?interleaved[i*channels+1]/32768:l
      const mixed=(l+r)*0.5
      leftSq+=l*l; rightSq+=r*r; cross+=l*r; monoSq+=mixed*mixed
      peak=Math.max(peak,Math.abs(l),Math.abs(r))
      if(Math.abs(l)>=0.999 || Math.abs(r)>=0.999) clips++
      if(i>0 && (mixed>=0)!==(prev>=0)) zcr++
      prev=mixed
      const bucket=Math.min(3,Math.floor(i*4/Math.max(1,frames)))
      rhythmSums[bucket]+=mixed*mixed; rhythmCounts[bucket]++
      const win=0.5-0.5*Math.cos(2*Math.PI*i/(this.fftSize-1))
      re[i]=mixed*win
    }

    this.fft(re,im)
    const mags=new Float64Array(this.fftSize/2+1)
    let magnitudeSum=0,weightedFrequency=0,logMagnitudeSum=0,flatnessMagnitudeSum=0,flatnessBins=0
    for(let bin=0;bin<mags.length;bin++){
      const mag=Math.hypot(re[bin],im[bin])/(this.fftSize/2)
      mags[bin]=mag
      const hz=bin*this.sampleRate/this.fftSize
      magnitudeSum+=mag; weightedFrequency+=hz*mag
      if(hz>=20&&hz<=16000){
        logMagnitudeSum+=Math.log(mag+1e-12); flatnessMagnitudeSum+=mag; flatnessBins++
      }
    }

    let rawFlux=0
    const denom=Math.max(1e-12,magnitudeSum)
    for(let i=0;i<mags.length;i++){
      const norm=mags[i]/denom
      rawFlux+=Math.max(0,norm-this.previousSpectrum[i])
      this.previousSpectrum[i]=norm
    }

    const rawMonoRms=Math.sqrt(monoSq/Math.max(1,frames))
    const rms=this.amplitudeLevel(rawMonoRms)
    const peakLevel=this.peakAmplitudeLevel(peak)
    const bass=this.bandLevel(mags,20,180)
    const lowMid=this.bandLevel(mags,180,800)
    const mid=this.bandLevel(mags,800,2000)
    const presence=this.bandLevel(mags,2000,6000)
    const air=this.bandLevel(mags,6000,16000)

    this.fluxBaseline=this.fluxBaseline<=1e-6?Math.max(rawFlux,1e-5):this.fluxBaseline*0.94+rawFlux*0.06
    const spectralFlux=rawMonoRms<1e-5?0:clamp(rawFlux/(this.fluxBaseline*3+1e-6))
    const arithmetic=flatnessBins?flatnessMagnitudeSum/flatnessBins:0
    const geometric=flatnessBins?Math.exp(logMagnitudeSum/flatnessBins):0
    const spectralFlatness=arithmetic>1e-12?clamp(geometric/arithmetic):0
    const zeroCrossingRate=frames>1?zcr/(frames-1):0
    const zcrShape=clamp(zeroCrossingRate*4)
    const percussive=clamp(spectralFlux*.42+zcrShape*.22+spectralFlatness*.18+presence*.10+bass*.08)
    const harmonic=clamp((1-spectralFlatness)*.42+((lowMid+mid)*.5)*.28+(1-percussive)*.16+(1-zcrShape)*.14)
    this.latestPercussive=percussive
    this.latestHarmonic=harmonic

    this.appendRhythmSubwindows(rhythmSums,rhythmCounts)
    this.appendHistory(spectralFlux,rms)
    this.processCount++
    if(this.processCount%6===0 && this.rhythmHistoryCount>=96) this.updateRhythm()

    const leftRms=Math.sqrt(leftSq/Math.max(1,frames))
    const rightRms=Math.sqrt(rightSq/Math.max(1,frames))
    const stereoBase=Math.sqrt((leftSq+rightSq)/(2*Math.max(1,frames)))
    const stereoCorrelation=clamp(cross/Math.sqrt(Math.max(1e-12,leftSq*rightSq)),-1,1)
    const monoCancellationRatio=clamp(1-rawMonoRms/Math.max(1e-9,stereoBase))

    return {
      rms,peak:peakLevel,bass,lowMid,mid,presence,air,spectralFlux,
      spectralCentroid:magnitudeSum>1e-12?weightedFrequency/magnitudeSum:0,
      spectralFlatness,zeroCrossingRate,
      tempoBpm:this.tempoBpm,tempoAutocorrBpm:this.tempoAutocorrBpm,tempoOnsetBpm:this.tempoOnsetBpm,
      tempoReliable:this.tempoReliable,tempoSource:this.tempoSource,
      tempoAutocorrConfidence:this.tempoAutocorrConfidence,tempoOnsetConfidence:this.tempoOnsetConfidence,
      processIntervalMs:this.fftSize*1000/this.sampleRate,beatConfidence:this.beatConfidence,
      meter:this.meter,meterCorr2:this.meterCorr2,meterCorr3:this.meterCorr3,meterCorr4:this.meterCorr4,
      meterAccent2:this.meterAccent2,meterAccent3:this.meterAccent3,meterAccent4:this.meterAccent4,
      meterConfidence:this.meterConfidence,meterBeatLag:this.meterBeatLag,
      meterOppositeAsymmetry4:this.meterOppositeAsymmetry4,subdivisionSimple:this.subdivisionSimple,
      subdivisionTriplet:this.subdivisionTriplet,swingness:this.swingness,
      percussiveProbability:percussive,harmonicProbability:harmonic,dynamicRange:this.dynamicRange(),
      rawLeftRmsDbfs:db20(leftRms),rawRightRmsDbfs:db20(rightRms),rawMonoRmsDbfs:db20(rawMonoRms),
      rawPeakDbfs:db20(peak),rawClipFraction:clips/Math.max(1,frames*channels),
      stereoCorrelation,monoCancellationRatio,
      tempoCandidates:this.tempoCandidates
    }
  }

  private appendRhythmSubwindows(sums:Float64Array,counts:Int32Array){
    for(let i=0;i<sums.length;i++){
      const energy=counts[i]>0?Math.sqrt(sums[i]/counts[i]):0
      const onset=Math.max(0,energy-this.previousRhythmEnergy*.90)
      this.previousRhythmEnergy=energy
      this.rhythmOnsetHistory[this.rhythmHistoryIndex]=onset
      this.rhythmEnergyHistory[this.rhythmHistoryIndex]=energy
      this.rhythmHistoryIndex=(this.rhythmHistoryIndex+1)%this.rhythmOnsetHistory.length
      this.rhythmHistoryCount=Math.min(this.rhythmHistoryCount+1,this.rhythmOnsetHistory.length)
    }
  }

  private chronologicalRhythm(source:Float64Array){
    const out=new Float64Array(this.rhythmHistoryCount)
    const start=this.rhythmHistoryCount<source.length?0:this.rhythmHistoryIndex
    for(let i=0;i<out.length;i++) out[i]=source[(start+i)%source.length]
    return out
  }

  private appendHistory(onset:number,energy:number){
    this.onsetHistory[this.historyIndex]=onset
    this.energyHistory[this.historyIndex]=energy
    this.historyIndex=(this.historyIndex+1)%this.onsetHistory.length
    this.historyCount=Math.min(this.historyCount+1,this.onsetHistory.length)
  }

  private chronological(source:Float64Array){
    const out=new Float64Array(this.historyCount)
    const start=this.historyCount<source.length?0:this.historyIndex
    for(let i=0;i<out.length;i++) out[i]=source[(start+i)%source.length]
    return out
  }

  private correlation(values:Float64Array,lag:number){
    if(lag<=0||values.length<=lag+6) return 0
    const count=values.length-lag
    let ma=0,mb=0
    for(let i=0;i<count;i++){ma+=values[i];mb+=values[i+lag]}
    ma/=count; mb/=count
    let num=0,da=0,db=0
    for(let i=0;i<count;i++){
      const a=values[i]-ma,b=values[i+lag]-mb
      num+=a*b;da+=a*a;db+=b*b
    }
    const d=Math.sqrt(da*db)
    return d<=1e-9?0:clamp(num/d,-1,1)
  }

  private peakIntervalTempo(onset:Float64Array,secondsPerWindow:number):[number,number]{
    if(onset.length<32) return [0,0]
    const sorted=Array.from(onset).sort((a,b)=>a-b)
    const med=median(sorted), p75=sorted[Math.floor((sorted.length-1)*.75)]
    const threshold=med+(p75-med)*.55
    const peaks:number[]=[]
    let last=-99
    for(let i=1;i<onset.length-1;i++){
      if(!(onset[i]>=threshold&&onset[i]>=onset[i-1]&&onset[i]>onset[i+1])) continue
      if(i-last<2){
        if(peaks.length&&onset[i]>onset[peaks[peaks.length-1]]){peaks[peaks.length-1]=i;last=i}
        continue
      }
      peaks.push(i);last=i
    }
    if(peaks.length<4) return [0,0]
    const bpms:number[]=[]
    for(let i=1;i<peaks.length;i++){
      const interval=(peaks[i]-peaks[i-1])*secondsPerWindow
      if(interval<=0) continue
      let bpm=60/interval
      while(bpm>145)bpm/=2
      while(bpm<58)bpm*=2
      if(bpm>=58&&bpm<=145) bpms.push(bpm)
    }
    if(bpms.length<3) return [0,0]
    const center=median(bpms)
    const close=bpms.filter(x=>Math.abs(x-center)<=10)
    if(close.length<3)return[0,0]
    const bpm=median(close),spread=median(close.map(x=>Math.abs(x-bpm)))
    const consistency=clamp(1-spread/16),coverage=clamp(close.length/bpms.length)
    return [bpm,clamp(consistency*.65+coverage*.35)]
  }

  private beatPhaseMeans(values:Float64Array,beatLag:number,beatsPerBar:number):number[]|null{
    if(beatLag<=0||beatsPerBar<2)return null
    const beatCount=Math.floor(values.length/beatLag)
    if(beatCount<beatsPerBar*3)return null
    const usable=Math.min(beatCount,24),start=values.length-usable*beatLag
    const beatEnergy:number[]=[]
    for(let beat=0;beat<usable;beat++){
      let sum=0,peak=0,from=start+beat*beatLag,to=Math.min(values.length,from+beatLag)
      for(let i=from;i<to;i++){sum+=values[i];peak=Math.max(peak,values[i])}
      const mean=to>from?sum/(to-from):0
      beatEnergy.push(mean*.45+peak*.55)
    }
    const sums=new Array(beatsPerBar).fill(0),counts=new Array(beatsPerBar).fill(0)
    beatEnergy.forEach((v,i)=>{const p=i%beatsPerBar;sums[p]+=v;counts[p]++})
    return sums.map((v,i)=>counts[i]?v/counts[i]:0)
  }

  private accentPeriodicity(values:Float64Array,beatLag:number,beatsPerBar:number){
    const phase=this.beatPhaseMeans(values,beatLag,beatsPerBar); if(!phase)return 0
    const overall=Math.max(1e-5,phase.reduce((a,b)=>a+b,0)/phase.length)
    const sorted=[...phase].sort((a,b)=>b-a)
    return beatsPerBar===2?clamp(Math.abs(phase[0]-phase[1])/overall):clamp((sorted[0]-sorted[1])/overall)
  }

  private oppositeAsymmetry4(values:Float64Array,beatLag:number){
    const p=this.beatPhaseMeans(values,beatLag,4); if(!p)return 0
    const overall=Math.max(1e-5,p.reduce((a,b)=>a+b,0)/4)
    return clamp((Math.abs(p[0]-p[2])+Math.abs(p[1]-p[3]))/(2*overall))
  }

  private appendTempoCandidates(a:number,ac:number,o:number,oc:number){
    const i=this.tempoHistoryIndex
    this.tempoAutocorrHistory[i]=a;this.tempoAutocorrConfidenceHistory[i]=ac
    this.tempoOnsetHistory[i]=o;this.tempoOnsetConfidenceHistory[i]=oc
    this.tempoHistoryIndex=(i+1)%8;this.tempoHistoryCount=Math.min(this.tempoHistoryCount+1,8)
  }

  private tempoStats(values:Float64Array,conf:Float64Array){
    const bpms:number[]=[],q:number[]=[]
    const start=this.tempoHistoryCount<values.length?0:this.tempoHistoryIndex
    for(let i=0;i<this.tempoHistoryCount;i++){
      const k=(start+i)%values.length,b=values[k]
      if(b<=0)continue
      bpms.push(b);q.push(clamp(conf[k]))
    }
    if(!bpms.length)return{bpm:0,stability:0,evidence:0,count:0}
    const center=median(bpms),mad=median(bpms.map(x=>Math.abs(x-center)))
    const stability=clamp(1-mad/12),coverage=clamp(bpms.length/Math.max(1,this.tempoHistoryCount))
    return{bpm:center,stability,evidence:clamp(median(q)*.62+stability*.28+coverage*.10),count:bpms.length}
  }

  private buildTempoFamilies(
    onset:Float64Array,
    energy:Float64Array,
    secondsPerWindow:number,
    minLag:number,
    maxLag:number,
  ){
    const windowWeights=new Map<number,number>()
    for(const [size,weight] of [[192,.25],[320,.30],[512,.45]] as const){
      const actual=Math.min(size,onset.length)
      if(actual<96)continue
      windowWeights.set(actual,(windowWeights.get(actual)??0)+weight)
    }

    const scoreByLag=new Map<number,number>()
    for(let lag=minLag;lag<=maxLag;lag++){
      let weighted=0,totalWeight=0
      for(const [size,weight] of windowWeights){
        const o=onset.subarray(onset.length-size)
        const e=energy.subarray(energy.length-size)
        const onsetCorr=Math.max(0,this.correlation(o,lag))
        const energyCorr=Math.max(0,this.correlation(e,lag))
        weighted+=(onsetCorr*.72+energyCorr*.28)*weight
        totalWeight+=weight
      }
      scoreByLag.set(lag,totalWeight>0?weighted/totalWeight:0)
    }

    const contributions:{bpm:number;score:number}[]=[]
    for(let lag=minLag;lag<=maxLag;lag++){
      const directScore=scoreByLag.get(lag)??0
      if(directScore<=0)continue
      const directBpm=60/(lag*secondsPerWindow)
      let familyBpm=directBpm
      let familyScore=directScore

      if(directBpm<72){
        const fasterLag=Math.round(lag/2)
        if(fasterLag>=minLag){
          const fasterScore=scoreByLag.get(fasterLag)??0
          const fasterBpm=60/(fasterLag*secondsPerWindow)
          const slowAccent2=this.accentPeriodicity(energy,lag,2)
          const fastAccent4=this.accentPeriodicity(energy,fasterLag,4)
          const fasterHasStructure=
            fasterScore>=.28 &&
            fasterScore>=directScore*.35 &&
            fastAccent4>=.20
          const slowLooksLikeHalfTime=
            fasterScore>=directScore*.65 &&
            slowAccent2<.20
          if(
            fasterBpm<=145 &&
            (fasterHasStructure||slowLooksLikeHalfTime)
          ){
            familyBpm=fasterBpm
            familyScore=directScore+fasterScore*.35
          }
        }
      }else if(directBpm>150){
        const twoThirdsLag=Math.round(lag*1.5)
        const halfLag=lag*2
        const twoThirdsScore=twoThirdsLag<=maxLag?(scoreByLag.get(twoThirdsLag)??0):0
        const halfScore=halfLag<=maxLag?(scoreByLag.get(halfLag)??0):0
        if(twoThirdsScore>=directScore*.45 && twoThirdsScore>=halfScore*.80){
          familyBpm=60/(twoThirdsLag*secondsPerWindow)
          familyScore=directScore+twoThirdsScore*.30
        }else if(halfScore>=directScore*.45){
          familyBpm=60/(halfLag*secondsPerWindow)
          familyScore=directScore+halfScore*.25
        }
      }

      contributions.push({bpm:familyBpm,score:familyScore})
    }

    contributions.sort((a,b)=>b.score-a.score)
    const groups:{weightedBpm:number;weight:number;scores:number[]}[]=[]
    for(const item of contributions){
      let group=groups.find(g=>Math.abs(g.weightedBpm/g.weight-item.bpm)<=7)
      if(!group){
        group={weightedBpm:0,weight:0,scores:[]}
        groups.push(group)
      }
      group.weightedBpm+=item.bpm*item.score
      group.weight+=item.score
      group.scores.push(item.score)
    }

    const families=groups.map(group=>{
      const ranked=[...group.scores].sort((a,b)=>b-a)
      const familyScore=
        (ranked[0]??0)+
        (ranked[1]??0)*.35+
        (ranked[2]??0)*.15
      const bpm=group.weightedBpm/Math.max(1e-6,group.weight)
      const distance=this.tempoBpm>0?Math.abs(bpm-this.tempoBpm):999
      const continuity=this.tempoBpm<=0
        ? 0
        : distance<=8
          ? .14
          : distance<=16
            ? .08
            : distance<=24
              ? .03
              : 0
      return {
        bpm,
        score:familyScore+continuity,
        support:ranked.filter(v=>v>=(ranked[0]??0)*.45).length,
      }
    }).sort((a,b)=>b.score-a.score)

    this.tempoCandidates=families.slice(0,4).map(candidate=>({
      bpm:candidate.bpm,
      score:candidate.score,
      support:candidate.support,
    }))
    return families
  }

  private updateRhythm(){
    const onset=this.chronologicalRhythm(this.rhythmOnsetHistory)
    if(onset.length<96)return
    const energy=this.chronologicalRhythm(this.rhythmEnergyHistory)
    const sec=(this.fftSize/this.sampleRate)/4
    const minLag=Math.max(3,Math.round(60/(190*sec)))
    const maxLag=Math.min(Math.floor(onset.length/3),Math.round(60/(55*sec)))
    if(maxLag<=minLag)return
    const families=this.buildTempoFamilies(onset,energy,sec,minLag,maxLag)
    const winner=families[0]
    if(!winner)return
    const autoBpm=clamp(winner.bpm,55,190)
    const autoLag=clamp(Math.round(60/(autoBpm*sec)),minLag,maxLag)
    const supportFactor=clamp(.72+Math.min(3,winner.support)*.10,.72,1)
    const autoConf=clamp((winner.score-.10)/.70)*supportFactor
    const [onsetBpm,onsetConf]=this.peakIntervalTempo(onset,sec)
    this.tempoAutocorrBpm=autoBpm;this.tempoOnsetBpm=onsetBpm
    this.tempoAutocorrConfidence=autoConf;this.tempoOnsetConfidence=onsetConf
    this.appendTempoCandidates(autoBpm,autoConf,onsetBpm,onsetConf)

    const a=this.tempoStats(this.tempoAutocorrHistory,this.tempoAutocorrConfidenceHistory)
    const o=this.tempoStats(this.tempoOnsetHistory,this.tempoOnsetConfidenceHistory)
    const aStable=a.count>=4&&a.stability>=.55,oStable=o.count>=4&&o.stability>=.62
    let selected=aStable?a.bpm:autoBpm,evidence=aStable?a.evidence:autoConf,stability=aStable?a.stability:.35
    this.tempoSource='autocorr'
    if(!aStable&&oStable){selected=o.bpm;evidence=o.evidence;stability=o.stability;this.tempoSource='onset'}
    else if(aStable&&oStable){
      const disagreement=Math.abs(a.bpm-o.bpm),ratio=Math.max(a.bpm,o.bpm)/Math.max(1e-6,Math.min(a.bpm,o.bpm))
      if(disagreement<=6){
        const aw=Math.max(.05,a.evidence),ow=Math.max(.05,o.evidence)
        selected=(a.bpm*aw+o.bpm*ow)/(aw+ow);evidence=Math.max(a.evidence,o.evidence)
        stability=Math.min(a.stability,o.stability);this.tempoSource='blend'
      }else if(ratio>=1.34&&ratio<=1.72&&o.stability>=.72&&o.evidence>=.58){
        selected=o.bpm;evidence=o.evidence;stability=o.stability;this.tempoSource='onset'
      }else if(ratio>=1.84&&ratio<=2.16&&a.bpm<o.bpm){
        const slowAccent2=this.accentPeriodicity(energy,autoLag,2)
        if(o.stability>=.72&&o.evidence>=.58&&slowAccent2<.20){
          selected=o.bpm;evidence=o.evidence;stability=o.stability;this.tempoSource='onset'
        }else{selected=a.bpm;evidence=a.evidence;stability=a.stability}
      }else if(o.evidence>=a.evidence+.18&&o.stability>=a.stability+.08){
        selected=o.bpm;evidence=o.evidence;stability=o.stability;this.tempoSource='onset'
      }
    }

    const ratio=(a.bpm>0&&o.bpm>0)?Math.max(a.bpm,o.bpm)/Math.min(a.bpm,o.bpm):1
    const relation=(a.bpm<=0||o.bpm<=0)?.72:Math.abs(a.bpm-o.bpm)<=12?1:ratio>=1.34&&ratio<=1.72?.86:ratio>=1.84&&ratio<=2.16?.78:.58
    const transientRatio=this.latestPercussive/Math.max(.12,this.latestHarmonic+.12)
    const transientSupport=clamp((transientRatio-.20)/.65)
    const timbreGate=.38+transientSupport*.62
    const instant=clamp(evidence*stability*relation*timbreGate)
    this.beatConfidence=this.beatConfidence*.72+instant*.28

    const reliableEvidence=selected>=55&&selected<=190&&evidence>=.45&&stability>=.58
    const reliableCandidate=reliableEvidence&&this.beatConfidence>=.46
    if(this.tempoBpm<=0&&reliableCandidate){this.tempoBpm=selected;this.pendingTempoBpm=0;this.pendingTempoCount=0}
    else if(this.tempoBpm>0){
      const distance=Math.abs(selected-this.tempoBpm)
      if(distance<=16){
        this.pendingTempoBpm=0;this.pendingTempoCount=0
        if(reliableCandidate)this.tempoBpm+=(selected-this.tempoBpm)*.28
      }else if(reliableCandidate){
        if(this.pendingTempoBpm>0&&Math.abs(selected-this.pendingTempoBpm)<=8){
          this.pendingTempoCount++;this.pendingTempoBpm=this.pendingTempoBpm*.65+selected*.35
        }else{this.pendingTempoBpm=selected;this.pendingTempoCount=1}
        if(this.pendingTempoCount>=4){
          const delta=clamp(this.pendingTempoBpm-this.tempoBpm,-24,24)
          this.tempoBpm+=delta*.32
          if(Math.abs(this.pendingTempoBpm-this.tempoBpm)<=12){this.pendingTempoBpm=0;this.pendingTempoCount=0}
        }
      }
    }
    const pending=this.pendingTempoCount>=1&&this.pendingTempoCount<=3&&this.pendingTempoBpm>0&&Math.abs(this.pendingTempoBpm-this.tempoBpm)>16
    if(reliableCandidate&&!pending)this.tempoReliabilityHold=6
    else if(this.tempoReliabilityHold>0&&reliableEvidence&&this.beatConfidence>=.32&&!pending)this.tempoReliabilityHold=6
    else if(this.tempoReliabilityHold>0)this.tempoReliabilityHold--
    this.tempoReliable=!pending&&reliableEvidence&&(reliableCandidate||this.tempoReliabilityHold>0)

    const analysisTempo=this.tempoBpm>0?this.tempoBpm:selected
    if(!(analysisTempo>=55&&analysisTempo<=190)){
      this.meter='unknown';this.meterConfidence=0;return
    }
    const tempoLag=clamp(Math.round(60/(analysisTempo*sec)),minLag,maxLag)
    let beatLag=tempoLag,best=-1
    for(let lag=Math.max(minLag,tempoLag-1);lag<=Math.min(maxLag,tempoLag+1);lag++){
      const c2=Math.max(0,this.correlation(energy,lag*2)),c3=Math.max(0,this.correlation(energy,lag*3)),c4=Math.max(0,this.correlation(energy,lag*4))
      const aa2=this.accentPeriodicity(energy,lag,2),aa3=this.accentPeriodicity(energy,lag,3),aa4=this.accentPeriodicity(energy,lag,4)
      const score=Math.max(c2,c3,c4)*.62+Math.max(aa2,aa3,aa4)*.38
      if(score>best){best=score;beatLag=lag}
    }
    this.meterBeatLag=beatLag
    this.meterCorr2=this.correlation(energy,beatLag*2);this.meterCorr3=this.correlation(energy,beatLag*3);this.meterCorr4=this.correlation(energy,beatLag*4)
    this.meterAccent2=this.accentPeriodicity(energy,beatLag,2);this.meterAccent3=this.accentPeriodicity(energy,beatLag,3);this.meterAccent4=this.accentPeriodicity(energy,beatLag,4)
    this.meterOppositeAsymmetry4=this.oppositeAsymmetry4(energy,beatLag)

    const simpleLag=Math.max(1,Math.round(beatLag/2)),tripletLag=Math.max(1,Math.round(beatLag/3))
    const simpleScore=clamp(Math.max(0,this.correlation(onset,simpleLag))*.72+Math.max(0,this.correlation(energy,simpleLag))*.28)
    const tripletScore=clamp(Math.max(0,this.correlation(onset,tripletLag))*.72+Math.max(0,this.correlation(energy,tripletLag))*.28)
    this.subdivisionSimple=this.subdivisionSimple*.70+simpleScore*.30
    this.subdivisionTriplet=this.subdivisionTriplet*.70+tripletScore*.30

    const p2=Math.max(0,this.meterCorr2),p3=Math.max(0,this.meterCorr3),p4=Math.max(0,this.meterCorr4)
    const macro2=clamp(p2*.55+this.meterAccent2*.45),macro3=clamp(p3*.55+this.meterAccent3*.45),macro4=clamp(p4*.55+this.meterAccent4*.45)
    const clear2=this.meterCorr2>=.36&&this.meterAccent2>=.22&&this.meterAccent2>=this.meterAccent3+.10&&this.meterAccent2>=this.meterAccent4+.12
    const ranked:[[number,number],[number,number],[number,number]]=[[2,macro2],[3,macro3],[4,macro4]]
    ranked.sort((x,y)=>y[1]-x[1])
    const gap=ranked[0][1]-ranked[1][1]
    let macro=0
    if(clear2)macro=2
    else if(ranked[0][1]>=.24&&gap>=.04)macro=ranked[0][0]
    else if(this.meterAccent4>=.46&&macro4>=.24)macro=4
    else if(this.meterAccent3>=.34&&macro3>=.24)macro=3
    const compound=this.subdivisionTriplet>=.18&&(this.subdivisionTriplet-this.subdivisionSimple)>=.06
    const candidate=macro===2?(compound?'6/8':'2/4'):macro===3?'3/4':macro===4?(compound?'12/8':'4/4'):'unknown'
    this.meter=this.tempoReliable?candidate:'unknown'
    this.meterConfidence=!this.tempoReliable||macro===0?0:clamp((ranked[0][1]*.72+clamp(gap,0,.35)*.80)*this.beatConfidence)
    const swing=clamp((this.subdivisionTriplet-this.subdivisionSimple-.02)*2.4)
    this.swingness=this.swingness*.76+swing*.24
  }

  private dynamicRange(){
    if(this.historyCount<12)return 0
    const v=this.chronological(this.energyHistory)
    let min=1,max=0
    for(const x of v){if(x<=.01)continue;min=Math.min(min,x);max=Math.max(max,x)}
    return max<=min||min>=1?0:clamp(max-min)
  }

  private bandLevel(m:Float64Array,lo:number,hi:number){
    let power=0,count=0
    for(let i=0;i<m.length;i++){
      const hz=i*this.sampleRate/this.fftSize
      if(hz<lo||hz>=hi)continue
      power+=m[i]*m[i];count++
    }
    if(!count)return 0
    return clamp((10*Math.log10(power/count+1e-12)+100)/75)
  }
  private amplitudeLevel(v:number){return clamp((db20(v)+60)/54)}
  private peakAmplitudeLevel(v:number){return clamp((db20(v)+30)/30)}

  private fft(re:Float64Array,im:Float64Array){
    let j=0
    for(let i=1;i<this.fftSize;i++){
      let bit=this.fftSize>>1
      while(j&bit){j^=bit;bit>>=1}
      j^=bit
      if(i<j){const tr=re[i];re[i]=re[j];re[j]=tr;const ti=im[i];im[i]=im[j];im[j]=ti}
    }
    for(let len=2;len<=this.fftSize;len<<=1){
      const angle=-2*Math.PI/len,wlr=Math.cos(angle),wli=Math.sin(angle)
      for(let start=0;start<this.fftSize;start+=len){
        let wr=1,wi=0
        for(let off=0;off<len/2;off++){
          const even=start+off,odd=even+len/2
          const or=re[odd]*wr-im[odd]*wi,oi=re[odd]*wi+im[odd]*wr
          const er=re[even],ei=im[even]
          re[even]=er+or;im[even]=ei+oi;re[odd]=er-or;im[odd]=ei-oi
          const nr=wr*wlr-wi*wli;wi=wr*wli+wi*wlr;wr=nr
        }
      }
    }
  }
}
