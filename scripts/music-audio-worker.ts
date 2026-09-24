import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createServer } from 'node:http'
import { ServerDspEngine } from '../src/brains/music-sensor/server-dsp'
import { publishMusicDspFrame, type MusicDspFrame } from '../src/brains/music-sensor/live-signal'

const HOST='127.0.0.1'
const PORT=8791
const SAMPLE_RATE=48_000
const CHANNELS=2
const FRAME_SAMPLES=4096
const BYTES_PER_FRAME=FRAME_SAMPLES*CHANNELS*2
const MAX_RING_BYTES=SAMPLE_RATE*CHANNELS*2*30
const ORACLE_MIN_BUFFER_SECONDS=12
const ORACLE_WINDOW_SECONDS=20
const ORACLE_INTERVAL_MS=5_000
const ORACLE_STALE_MS=12_000

type TempoOracleState={
  bpm:number
  confidence:number
  beatCount:number
  intervalMad:number
  analysisMs:number
  receivedAt:number
}
type TempoFamilyAgreement='direct'|'octave'|'conflict'|'none'


class DeviceSession {
  readonly deviceId:string
  readonly ffmpeg:ChildProcessWithoutNullStreams
  readonly oracle:ChildProcessWithoutNullStreams
  readonly dsp=new ServerDspEngine(SAMPLE_RATE,FRAME_SAMPLES)
  private carry=Buffer.alloc(0)
  private oracleCarry=''
  private oracleBusy=false
  private lastOracleRequestAt=0
  private latestOracle:TempoOracleState|null=null
  private recentPeakDbfs=-180
  private ring:Buffer[]=[]
  private ringBytes=0
  private frameSeq=0
  private publishChain=Promise.resolve()
  lastAudioSeq=0
  lastChunkAt=0
  lastFrame:MusicDspFrame|null=null

  constructor(deviceId:string){
    this.deviceId=deviceId
    this.oracle=spawn('node',['scripts/music-tempo-oracle.cjs'],{
      cwd:process.cwd(),
      stdio:['pipe','pipe','pipe'],
    })
    this.oracle.stdout.setEncoding('utf8')
    this.oracle.stdout.on('data',(chunk:string)=>this.acceptOracleOutput(chunk))
    this.oracle.stderr.on('data',(chunk:Buffer)=>
      process.stderr.write('[music-tempo oracle] '+chunk.toString()),
    )
    this.oracle.on('exit',(code,signal)=>{
      this.oracleBusy=false
      console.error('[music-tempo] oracle exit',this.deviceId,{code,signal})
    })
    this.oracle.stdin.on('error',()=>{this.oracleBusy=false})

    this.ffmpeg=spawn('ffmpeg',[
      '-hide_banner','-loglevel','error',
      '-probesize','2048','-analyzeduration','0',
      '-f','aac','-i','pipe:0',
      '-ac',String(CHANNELS),'-ar',String(SAMPLE_RATE),
      '-f','s16le','-acodec','pcm_s16le','pipe:1',
    ],{stdio:['pipe','pipe','pipe']})
    this.ffmpeg.stdout.on('data',(chunk:Buffer)=>this.acceptPcm(chunk))
    this.ffmpeg.stderr.on('data',(chunk:Buffer)=>process.stderr.write('[music-audio ffmpeg] '+chunk.toString()))
    this.ffmpeg.on('exit',(code,signal)=>{
      console.error('[music-audio] ffmpeg exit',this.deviceId,{code,signal})
      sessions.delete(this.deviceId)
    })
  }

  pushAac(chunk:Uint8Array,audioSeq:number){
    this.lastAudioSeq=audioSeq
    this.lastChunkAt=Date.now()
    this.ffmpeg.stdin.write(chunk)
  }

  private acceptPcm(chunk:Buffer){
    this.carry=this.carry.length?Buffer.concat([this.carry,chunk]):Buffer.from(chunk)
    while(this.carry.length>=BYTES_PER_FRAME){
      const frameBytes=Buffer.from(this.carry.subarray(0,BYTES_PER_FRAME))
      this.carry=Buffer.from(this.carry.subarray(BYTES_PER_FRAME))
      this.pushRing(frameBytes)
      this.maybeAnalyzeTempoOracle()
      const samples=new Int16Array(frameBytes.buffer,frameBytes.byteOffset,frameBytes.byteLength/2)
      const features=this.dsp.process(samples,CHANNELS)
      this.recentPeakDbfs=features.rawPeakDbfs
      const pulse=this.resolvePulse(features)
      const frame:MusicDspFrame={
        deviceId:this.deviceId,
        seq:++this.frameSeq,
        at:new Date().toISOString(),
        sampleRate:SAMPLE_RATE,
        windowMs:Math.round(FRAME_SAMPLES*1000/SAMPLE_RATE),
        transport:'server-aac',
        sourceAudioSeq:this.lastAudioSeq,
        ...features,
        ...pulse,
      }
      this.lastFrame=frame
      if(!this.deviceId.startsWith('__test__')){
        this.publishChain=this.publishChain
          .then(()=>publishMusicDspFrame(frame))
          .catch(err=>console.error('[music-audio] publish failed',err))
      }
    }
  }

  private pushRing(frame:Buffer){
    this.ring.push(frame);this.ringBytes+=frame.length
    while(this.ringBytes>MAX_RING_BYTES&&this.ring.length){
      const old=this.ring.shift()!
      this.ringBytes-=old.length
    }
  }

  private acceptOracleOutput(chunk:string){
    this.oracleCarry+=chunk
    while(true){
      const newline=this.oracleCarry.indexOf('\n')
      if(newline<0)break
      const line=this.oracleCarry.slice(0,newline).trim()
      this.oracleCarry=this.oracleCarry.slice(newline+1)
      if(!line)continue
      this.oracleBusy=false
      try{
        const parsed=JSON.parse(line) as Partial<TempoOracleState>&{error?:string}
        if(parsed.error)continue
        const bpm=Number(parsed.bpm)
        const confidence=Number(parsed.confidence)
        if(!Number.isFinite(bpm)||bpm<40||bpm>210||!Number.isFinite(confidence))continue
        this.latestOracle={
          bpm,
          confidence:Math.max(0,Math.min(1,confidence)),
          beatCount:Number(parsed.beatCount)||0,
          intervalMad:Number(parsed.intervalMad)||0,
          analysisMs:Number(parsed.analysisMs)||0,
          receivedAt:Date.now(),
        }
      }catch{}
    }
  }

  private maybeAnalyzeTempoOracle(){
    const now=Date.now()
    const bufferSeconds=this.ringBytes/(SAMPLE_RATE*CHANNELS*2)
    if(bufferSeconds<ORACLE_MIN_BUFFER_SECONDS)return
    if(this.recentPeakDbfs<-55)return
    if(this.oracleBusy){
      if(now-this.lastOracleRequestAt<=10_000)return
      this.oracleBusy=false
    }
    if(now-this.lastOracleRequestAt<ORACLE_INTERVAL_MS)return
    const pcm=this.snapshot(Math.min(ORACLE_WINDOW_SECONDS,bufferSeconds))
    if(!pcm.length)return
    const header=Buffer.allocUnsafe(4)
    header.writeUInt32LE(pcm.length,0)
    this.oracleBusy=true
    this.lastOracleRequestAt=now
    this.oracle.stdin.write(header)
    this.oracle.stdin.write(pcm)
  }

  private resolvePulse(features:ReturnType<ServerDspEngine['process']>){
    const oracle=this.latestOracle
    if(!oracle||Date.now()-oracle.receivedAt>ORACLE_STALE_MS){
      return {
        pulseBpm:undefined,
        pulseConfidence:0,
        pulseReliable:false,
        tempoFamilyAgreement:'none' as TempoFamilyAgreement,
        tempoOctaveAmbiguous:false,
        tempoOracleAnalysisMs:undefined,
      }
    }

    const candidates=features.tempoCandidates??[]
    const topCandidate=candidates[0]
    const top=topCandidate?.bpm
    const near=(a:number,b:number)=>Math.abs(a-b)<=Math.max(3,b*.04)
    let agreement:TempoFamilyAgreement='none'
    if(typeof top==='number'&&top>0){
      if(near(top,oracle.bpm)){
        agreement='direct'
      }else if(near(top,oracle.bpm*.5)||near(top,oracle.bpm*2)){
        agreement='octave'
      }else{
        const directRescue=candidates
          .slice(1,3)
          .find(candidate=>
            candidate.score>=(topCandidate?.score??0)*.35 &&
            near(candidate.bpm,oracle.bpm),
          )
        agreement=directRescue?'direct':'conflict'
      }
    }

    const confidence=agreement==='direct'
      ? oracle.confidence
      : agreement==='octave'
        ? oracle.confidence*.92
        : agreement==='none'
          ? oracle.confidence*.75
          : oracle.confidence*.35
    const pulseReliable=
      (agreement==='direct'||agreement==='octave')
        ? confidence>=.55
        : agreement==='none'
          ? confidence>=.78
          : false

    const pulseBpm=
      agreement==='direct'
        ? oracle.bpm
        : agreement==='octave'&&typeof top==='number'&&top>0
          ? top
          : agreement==='none'
            ? oracle.bpm
            : undefined

    return {
      pulseBpm,
      pulseConfidence:confidence,
      pulseReliable,
      tempoFamilyAgreement:agreement,
      tempoOctaveAmbiguous:agreement==='octave',
      tempoOracleAnalysisMs:oracle.analysisMs,
    }
  }

  snapshot(seconds=30){
    const wanted=Math.max(1,Math.min(30,seconds))*SAMPLE_RATE*CHANNELS*2
    let remaining=Math.min(wanted,this.ringBytes)
    const picked:Buffer[]=[]
    for(let i=this.ring.length-1;i>=0&&remaining>0;i--){
      const b=this.ring[i]
      picked.push(b)
      remaining-=b.length
    }
    picked.reverse()
    const all=Buffer.concat(picked)
    return all.length>wanted?all.subarray(all.length-wanted):all
  }

  status(){
    return {
      deviceId:this.deviceId,
      lastAudioSeq:this.lastAudioSeq,
      ageMs:this.lastChunkAt?Date.now()-this.lastChunkAt:null,
      bufferSeconds:this.ringBytes/(SAMPLE_RATE*CHANNELS*2),
      frameSeq:this.frameSeq,
      tempoBpm:this.lastFrame?.tempoBpm??null,
      tempoReliable:this.lastFrame?.tempoReliable??false,
      pulseBpm:this.lastFrame?.pulseBpm??null,
      pulseConfidence:this.lastFrame?.pulseConfidence??0,
      pulseReliable:this.lastFrame?.pulseReliable??false,
      tempoFamilyAgreement:this.lastFrame?.tempoFamilyAgreement??'none',
      oracleBusy:this.oracleBusy,
      oracleRequestAgeMs:this.lastOracleRequestAt?Date.now()-this.lastOracleRequestAt:null,
      oracleLatest:this.latestOracle,
      meter:this.lastFrame?.meter??'unknown',
      rawPeakDbfs:this.lastFrame?.rawPeakDbfs??null,
      stereoCorrelation:this.lastFrame?.stereoCorrelation??null,
      monoCancellationRatio:this.lastFrame?.monoCancellationRatio??null,
    }
  }

  close(){
    this.ffmpeg.stdin.end()
    this.ffmpeg.kill('SIGTERM')
    this.oracle.stdin.end()
    this.oracle.kill('SIGTERM')
  }
}

const sessions=new Map<string,DeviceSession>()
function getSession(deviceId:string){
  let session=sessions.get(deviceId)
  if(!session){session=new DeviceSession(deviceId);sessions.set(deviceId,session)}
  return session
}

const server=createServer(async (request,response)=>{
  try{
    const url=new URL(request.url??'/',`http://${HOST}:${PORT}`)
    if(request.method==='GET'&&url.pathname==='/health'){
      response.setHeader('content-type','application/json')
      response.end(JSON.stringify({ok:true,sessions:[...sessions.values()].map(s=>s.status())}))
      return
    }
    if(request.method==='GET'&&url.pathname.startsWith('/buffer/')){
      const deviceId=decodeURIComponent(url.pathname.slice('/buffer/'.length))
      const session=sessions.get(deviceId)
      if(!session){response.statusCode=404;response.end('not found');return}
      const seconds=Number(url.searchParams.get('seconds')??30)
      const body=session.snapshot(seconds)
      response.setHeader('content-type','audio/L16')
      response.setHeader('x-sample-rate',String(SAMPLE_RATE))
      response.setHeader('x-channels',String(CHANNELS))
      response.end(body)
      return
    }
    if(request.method!=='POST'||url.pathname!=='/chunk'){
      response.statusCode=404;response.end('not found');return
    }
    const deviceId=String(request.headers['x-device-id']??'').trim()
    const audioSeq=Number(request.headers['x-audio-seq']??0)
    if(!deviceId||!Number.isInteger(audioSeq)||audioSeq<0){
      response.statusCode=400;response.end('bad metadata');return
    }
    const chunks:Buffer[]=[]
    let size=0
    for await (const chunk of request){
      const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk)
      size+=b.length
      if(size>131072){response.statusCode=413;response.end('bad chunk');return}
      chunks.push(b)
    }
    if(!size){response.statusCode=400;response.end('bad chunk');return}
    getSession(deviceId).pushAac(Buffer.concat(chunks),audioSeq)
    response.statusCode=202
    response.end()
  }catch(error){
    console.error('[music-audio] request failed',error)
    response.statusCode=500
    response.end('error')
  }
})
server.listen(PORT,HOST)

const cleanup=setInterval(()=>{
  const now=Date.now()
  for(const [id,s] of sessions){
    if(s.lastChunkAt&&now-s.lastChunkAt>20_000){s.close();sessions.delete(id)}
  }
},5000)
cleanup.unref()

for(const signal of ['SIGINT','SIGTERM'] as const){
  process.on(signal,()=>{
    for(const s of sessions.values())s.close()
    server.close(()=>process.exit(0))
  })
}

console.log(`[music-audio] worker listening on http://${HOST}:${PORT}`)
