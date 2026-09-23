import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { ServerDspEngine } from '../src/brains/music-sensor/server-dsp'

type Candidate={id:number;bpm:number;signature:string;inst:string[];genres:string[]}
type FsMeta={id:number;name?:string;license?:string;preview_url?:string;tags?:string[];annotations?:{bpm?:number}}

const ROOT='/tmp/music-dsp-fsld-batch'
const CANDIDATES='/tmp/fsld-candidates.json'
const HF='https://huggingface.co/datasets/nicolaus625/cmi/resolve/main/116_FreesoundLoopDataset/fs_analysis/'
const OUT='artifacts/music-dsp-eval/fsld-2026-09-23.json'

const median=(xs:number[])=>{
  if(!xs.length)return 0
  const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2)
  return a.length%2?a[m]:(a[m-1]+a[m])/2
}
const safeName=(s:string)=>s.replace(/[^a-z0-9._-]+/gi,'_')
const sh=(cmd:string,args:string[])=>{
  const r=spawnSync(cmd,args,{stdio:['ignore','pipe','pipe']})
  if(r.status!==0)throw new Error(String(r.stderr||r.stdout||`${cmd} failed`))
}
async function metaFor(id:number):Promise<FsMeta|null>{
  try{
    const r=await fetch(HF+id+'.json',{signal:AbortSignal.timeout(10_000)})
    if(!r.ok)return null
    return await r.json() as FsMeta
  }catch{return null}
}
function instKey(c:Candidate){return c.inst?.slice().sort().join('+')||'none'}

async function choose(candidates:Candidate[]){
  const chosen:Array<Candidate&{meta:FsMeta}>=[]
  const used=new Set<number>()
  async function fill(pool:Candidate[],quota:number){
    const seenInst=new Set<string>()
    const ordered=[...pool].sort((a,b)=>a.id-b.id)
    for(let pass=0;pass<2&&quota>0;pass++){
      for(const c of ordered){
        if(quota<=0)break
        if(used.has(c.id))continue
        const k=instKey(c)
        if(pass===0&&seenInst.has(k))continue
        const meta=await metaFor(c.id)
        if(!meta?.preview_url||!meta.license)continue
        chosen.push({...c,meta});used.add(c.id);seenInst.add(k);quota--
      }
    }
  }
  await fill(candidates.filter(c=>c.signature==='2/4'),2)
  await fill(candidates.filter(c=>c.signature==='3/4'),2)
  for(const [lo,hi,q] of [[60,79,4],[80,99,4],[100,119,4],[120,139,4],[140,159,4],[160,179,4],[180,190,2]] as const){
    await fill(candidates.filter(c=>c.signature==='4/4'&&c.bpm>=lo&&c.bpm<=hi),q)
  }
  return chosen
}

function evalPcm(path:string,gtBpm:number,signature:string){
  const b=readFileSync(path)
  const samples=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2)
  const engine=new ServerDspEngine(48000,4096)
  const rows:any[]=[]
  for(let off=0,n=0;off+8192<=samples.length;off+=8192,n++){
    const f=engine.process(samples.subarray(off,off+8192),2)
    if(n%6===5)rows.push(f)
  }
  const tail=rows.slice(-20)
  const reliable=tail.filter(r=>r.tempoReliable&&r.tempoBpm>0)
  const tempos=reliable.map(r=>Number(r.tempoBpm)).filter(Number.isFinite)
  const estimate=tempos.length?median(tempos):null
  const tolerance=Math.max(3,gtBpm*.04)
  let tempoClass='unresolved'
  let absError:number|null=null
  if(estimate!==null){
    absError=Math.abs(estimate-gtBpm)
    if(absError<=tolerance)tempoClass='exact'
    else{
      const h=Math.min(Math.abs(estimate-gtBpm*.5),Math.abs(estimate-gtBpm*2))
      tempoClass=h<=tolerance?'harmonic':'fail'
    }
  }
  const meterCounts:Record<string,number>={}
  for(const r of tail){
    const m=String(r.meter??'unknown')
    meterCounts[m]=(meterCounts[m]??0)+1
  }
  const meterTotal=tail.length||1
  const meterCorrect=meterCounts[signature]??0
  const meterUnknown=meterCounts.unknown??0
  const meterWrong=meterTotal-meterCorrect-meterUnknown
  const final=rows.at(-1)
  return {
    estimateBpm:estimate,
    absError,
    tempoClass,
    tempoReliableFrames:reliable.length,
    evaluatedFrames:tail.length,
    meterCounts,
    meterCorrectRate:meterCorrect/meterTotal,
    meterUnknownRate:meterUnknown/meterTotal,
    meterWrongRate:meterWrong/meterTotal,
    finalCandidates:final?.tempoCandidates?.slice(0,4)??[],
    beatConfidence:final?.beatConfidence??null,
    finalMeter:final?.meter??'unknown',
  }
}

async function main(){
  const candidates=JSON.parse(readFileSync(CANDIDATES,'utf8')) as Candidate[]
  rmSync(ROOT,{recursive:true,force:true});mkdirSync(ROOT,{recursive:true})
  mkdirSync('artifacts/music-dsp-eval',{recursive:true})
  const chosen=await choose(candidates)
  console.log('selected',chosen.length,chosen.map(c=>({id:c.id,bpm:c.bpm,sig:c.signature,inst:instKey(c)})))
  const previous=existsSync(OUT)?JSON.parse(readFileSync(OUT,'utf8'))?.results??[]:[]
  const results:any[]=[...previous]
  const completedIds=new Set(results.map(r=>Number(r.id)))
  for(let i=0;i<chosen.length;i++){
    const c=chosen[i],m=c.meta
    if(completedIds.has(c.id)){
      console.log(`[${i+1}/${chosen.length}] resume skip`,c.id)
      continue
    }
    const stem=safeName(String(c.id))
    const src=`${ROOT}/${stem}.mp3`,aac=`${ROOT}/${stem}.aac`,pcm=`${ROOT}/${stem}.pcm`
    let row:any={id:c.id,groundTruthBpm:c.bpm,signature:c.signature,instrumentation:c.inst,genres:c.genres,name:m.name??null,license:m.license??null,previewUrl:m.preview_url??null}
    try{
      const url=(m.preview_url??'').replace(/^http:/,'https:')
      const resp=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(15_000)})
      if(!resp.ok)throw new Error(`download HTTP ${resp.status}`)
      writeFileSync(src,Buffer.from(await resp.arrayBuffer()))
      sh('ffmpeg',['-hide_banner','-loglevel','error','-stream_loop','-1','-i',src,'-t','30','-ac','2','-ar','48000','-c:a','aac','-b:a','128k','-f','adts',aac,'-y'])
      sh('ffmpeg',['-hide_banner','-loglevel','error','-probesize','2048','-analyzeduration','0','-f','aac','-i',aac,'-ac','2','-ar','48000','-f','s16le','-acodec','pcm_s16le',pcm,'-y'])
      row={...row,...evalPcm(pcm,c.bpm,c.signature)}
      console.log(`[${i+1}/${chosen.length}]`,c.id,c.bpm,c.signature,row.tempoClass,row.estimateBpm?.toFixed?.(2),row.finalMeter,row.meterCounts)
    }catch(error){
      row.error=String(error)
      console.log(`[${i+1}/${chosen.length}] ERROR`,c.id,String(error))
    }finally{
      rmSync(src,{force:true});rmSync(aac,{force:true});rmSync(pcm,{force:true})
    }
    results.push(row)
    writeFileSync(OUT,JSON.stringify({source:'Freesound Loop Dataset',generatedAt:new Date().toISOString(),results},null,2))
  }
  const ok=results.filter(r=>!r.error)
  const tempo:any={}
  for(const r of ok)tempo[r.tempoClass]=(tempo[r.tempoClass]??0)+1
  const bySig:any={}
  for(const r of ok){
    const x=bySig[r.signature]??={n:0,correct:0,unknown:0,wrong:0}
    x.n++;x.correct+=r.meterCorrectRate;x.unknown+=r.meterUnknownRate;x.wrong+=r.meterWrongRate
  }
  for(const x of Object.values(bySig) as any[]){
    x.correctRate=x.correct/x.n;x.unknownRate=x.unknown/x.n;x.wrongRate=x.wrong/x.n
    delete x.correct;delete x.unknown;delete x.wrong
  }
  const summary={selected:chosen.length,completed:ok.length,errors:results.length-ok.length,tempo,bySignature:bySig}
  writeFileSync(OUT,JSON.stringify({source:'Freesound Loop Dataset',generatedAt:new Date().toISOString(),summary,results},null,2))
  rmSync(ROOT,{recursive:true,force:true})
  console.log('SUMMARY',JSON.stringify(summary,null,2))
}
await main()
