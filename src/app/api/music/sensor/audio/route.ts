import { NextResponse } from 'next/server'
import { authenticateHubDevice, MUSIC_SENSOR_SCOPE } from '@/lib/hub-device-auth'

export const dynamic='force-dynamic'
export const runtime='nodejs'

const WORKER_URL=process.env.MUSIC_AUDIO_WORKER_URL ?? 'http://127.0.0.1:8791/chunk'

function intHeader(request:Request,name:string,min:number,max:number){
  const value=Number(request.headers.get(name))
  return Number.isInteger(value)&&value>=min&&value<=max?value:null
}

export async function POST(request:Request){
  const device=await authenticateHubDevice(request.headers.get('authorization'),MUSIC_SENSOR_SCOPE)
  if(!device)return NextResponse.json({accepted:false},{status:401})

  const seq=intHeader(request,'x-audio-seq',0,Number.MAX_SAFE_INTEGER)
  const sampleRate=intHeader(request,'x-sample-rate',8_000,192_000)
  const channels=intHeader(request,'x-channels',1,8)
  const bitrate=intHeader(request,'x-bitrate',32_000,512_000)
  const contentType=request.headers.get('content-type')?.split(';')[0]?.trim()
  if(seq===null||sampleRate!==48_000||channels!==2||bitrate!==128_000||contentType!=='audio/aac'){
    return NextResponse.json({accepted:false},{status:400})
  }

  const body=new Uint8Array(await request.arrayBuffer())
  if(!body.byteLength||body.byteLength>131_072){
    return NextResponse.json({accepted:false},{status:413})
  }

  try{
    const upstream=await fetch(WORKER_URL,{
      method:'POST',
      headers:{
        'content-type':'audio/aac',
        'x-device-id':device.id,
        'x-audio-seq':String(seq),
      },
      body,
      signal:AbortSignal.timeout(4_000),
    })
    if(!upstream.ok)return NextResponse.json({accepted:false},{status:503})
    return new Response(null,{status:202})
  }catch{
    return NextResponse.json({accepted:false},{status:503})
  }
}
