'use client'

import { useEffect, useRef } from 'react'
import styles from './rack-server-visual.module.css'

type LedTone='blue'|'green'|'amber'|'dim'
type LedMode='power'|'link'|'activity'|'warning'

const LED_PROFILES:Record<LedMode,{on:[number,number];off:[number,number];burst:number;idleOpacity:[number,number]}> = {
  power:{on:[1800,5200],off:[45,160],burst:.08,idleOpacity:[.55,.74]},
  link:{on:[65,190],off:[140,950],burst:.34,idleOpacity:[.12,.28]},
  activity:{on:[35,120],off:[70,620],burst:.62,idleOpacity:[.06,.22]},
  warning:{on:[90,220],off:[1500,5200],burst:.08,idleOpacity:[.04,.16]},
}

function randomBetween(min:number,max:number){
  return min+Math.random()*(max-min)
}

function LiveLed({
  cx,cy,r=2.4,tone='blue',mode='activity',seed=0,
}:{
  cx:number;cy:number;r?:number;tone?:LedTone;mode?:LedMode;seed?:number
}){
  const ref=useRef<SVGCircleElement>(null)

  useEffect(()=>{
    const el=ref.current
    if(!el) return
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if(reduced){
      el.style.opacity=mode==='power'?'.82':'.62'
      return
    }

    const p=LED_PROFILES[mode]
    let cancelled=false
    let timer:ReturnType<typeof setTimeout>|undefined
    let burstLeft=0

    const scheduleOn=()=>{
      if(cancelled) return
      el.style.opacity=String(randomBetween(.72,1))
      const hold=randomBetween(p.on[0],p.on[1])
      timer=setTimeout(scheduleOff,hold)
    }

    const scheduleOff=()=>{
      if(cancelled) return
      el.style.opacity=String(randomBetween(p.idleOpacity[0],p.idleOpacity[1]))

      if(mode==='power'){
        timer=setTimeout(scheduleOn,randomBetween(p.off[0],p.off[1]))
        return
      }

      if(burstLeft>0){
        burstLeft-=1
        timer=setTimeout(scheduleOn,randomBetween(34,110))
        return
      }

      if(Math.random()<p.burst){
        burstLeft=Math.floor(randomBetween(1,4))
      }
      timer=setTimeout(scheduleOn,randomBetween(p.off[0],p.off[1]))
    }

    timer=setTimeout(scheduleOn,70+(seed*137)%900)
    return ()=>{
      cancelled=true
      if(timer) clearTimeout(timer)
    }
  },[mode,seed])

  return <circle ref={ref} cx={cx} cy={cy} r={r} className={[styles.led,styles[tone]].join(' ')} />
}

function Pulse({pathId,begin,dur,tone='blue',r=4.6}:{pathId:string;begin:string;dur:string;tone?:'blue'|'green'|'amber';r?:number}){
  return (
    <circle r={r} className={[styles.pulse,styles[tone]].join(' ')}>
      <animateMotion begin={begin} dur={dur} repeatCount="indefinite" rotate="auto">
        <mpath href={'#'+pathId}/>
      </animateMotion>
    </circle>
  )
}

function RackBlade({y,index}:{y:number;index:number}){
  return (
    <g className={styles.blade}>
      <rect x="24" y={y} width="177" height="38" rx="2.5" className={styles.bladeFace}/>
      <rect x="37" y={y+9} width="42" height="7" rx="3.5" className={styles.driveHandle}/>
      <rect x="89" y={y+8} width="74" height="3" rx="1.5" className={styles.vent}/>
      <rect x="89" y={y+15} width="62" height="3" rx="1.5" className={styles.vent}/>
      <rect x="89" y={y+22} width="69" height="3" rx="1.5" className={styles.vent}/>
      <LiveLed cx={181} cy={y+11} tone="green" mode={index%3===0?'power':'link'} seed={10+index*4}/>
      <LiveLed cx={181} cy={y+22} tone="blue" mode="activity" seed={11+index*4}/>
      <LiveLed cx={191} cy={y+11} tone={index===2?'amber':'blue'} mode={index===2?'warning':'activity'} seed={12+index*4}/>
      <LiveLed cx={191} cy={y+22} tone="blue" mode="activity" seed={13+index*4}/>
    </g>
  )
}

export function RackServerVisual(){
  const topDots=Array.from({length:9*15},(_,i)=>({row:Math.floor(i/15),col:i%15}))
  const sideDots=Array.from({length:7*6},(_,i)=>({row:Math.floor(i/6),col:i%6}))
  const ports=Array.from({length:18},(_,i)=>i)
  const floorFrontLeft={x:625,y:738}
  const floorFront={x:225,y:27}
  const floorTowardViewer={x:-165,y:79}
  const floorRows=[.22,.62,1.02,1.42]
  const floorCols=[-1.25,-.8,-.35,.1,.55,1,1.45,1.9,2.35]

  return (
    <figure className={styles.visual} aria-label="Isometric cloud rack with internet, storage, edge nodes and live cable signals">
      <svg className={styles.svg} viewBox="0 0 1672 941" role="img">
        <defs>
          <filter id="rackv2-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4.2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="rackv2-top-vent-clip">
            <rect x="48" y="30" width="128" height="72" rx="10"/>
          </clipPath>
          <clipPath id="rackv2-side-vent-clip">
            <rect x="45" y="132" width="82" height="310" rx="12"/>
          </clipPath>
          <mask id="rackv2-rear-occlusion" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941">
            <rect x="0" y="0" width="1672" height="941" fill="white"/>
            <polygon points="625,170 790,91 1015,118 1015,686 850,765 625,738" fill="black"/>
          </mask>
        </defs>

        <g className={styles.floor} mask="url(#rackv2-rear-occlusion)">
          {floorRows.map((depth,index)=>{
            const baseX=floorFrontLeft.x+floorTowardViewer.x*depth
            const baseY=floorFrontLeft.y+floorTowardViewer.y*depth
            const startX=baseX-floorFront.x*1.45
            const startY=baseY-floorFront.y*1.45
            const endX=baseX+floorFront.x*3.55
            const endY=baseY+floorFront.y*3.55
            return <path key={'row-'+index} d={'M'+startX+' '+startY+'L'+endX+' '+endY}/>
          })}
          {floorCols.map((u,index)=>{
            const baseX=floorFrontLeft.x+floorFront.x*u
            const baseY=floorFrontLeft.y+floorFront.y*u
            const startX=baseX-floorTowardViewer.x*.72
            const startY=baseY-floorTowardViewer.y*.72
            const endX=baseX+floorTowardViewer.x*1.9
            const endY=baseY+floorTowardViewer.y*1.9
            return <path key={'col-'+index} d={'M'+startX+' '+startY+'L'+endX+' '+endY}/>
          })}
        </g>

        <g className={styles.labels}>
          <text x="118" y="322">FIG 1.0</text><text x="118" y="345">INTERNET</text>
          <path d="M211 350V389"/><circle cx="211" cy="390" r="2.4"/>
          <text x="486" y="92">FIG 1.1</text><text x="486" y="115">CLOUD SERVER RACK</text>
          <path d="M667 87V128"/><circle cx="667" cy="130" r="2.4"/>
          <text x="1486" y="189">FIG 1.2</text><text x="1486" y="212">STORAGE</text>
          <path d="M1467 178V260"/><circle cx="1467" cy="261" r="2.4"/>
          <text x="1495" y="578">FIG 1.3</text><text x="1495" y="601">EDGE NODE</text>
          <path d="M1478 568V648"/><circle cx="1478" cy="649" r="2.4"/>
        </g>

        {/* Right-side cable runs are deliberately behind the cabinet. */}
        <g className={[styles.cables,styles.rearCables].join(' ')} mask="url(#rackv2-rear-occlusion)">
          <path id="v2-storage-1" d="M805 430 C930 421 1022 397 1102 356 C1140 337 1167 326 1187 323 C1195 321.9 1200 321.9 1204 322"/>
          <path id="v2-storage-2" d="M810 444 C930 443 1028 421 1111 380 C1145 364 1170 352 1188 349 C1195 347.9 1200 347.9 1204 348"/>
          <path id="v2-storage-3" d="M815 458 C934 465 1036 443 1118 402 C1150 387 1174 378 1188 375 C1195 373.9 1200 373.9 1204 374"/>
          <path id="v2-edge-1" d="M815 560 C1088 575 1118 628 1146 666 C1161 686 1174 699 1184 703 C1187 704 1189 704 1190 704"/>
          <path id="v2-edge-2" d="M820 578 C1081 594 1112 645 1140 684 C1156 707 1170 721 1184 725 C1187 726 1189 726 1190 726"/>
          <Pulse pathId="v2-storage-1" begin=".15s" dur="3.9s" tone="blue"/>
          <Pulse pathId="v2-storage-1" begin="2.2s" dur="5.3s" tone="blue" r={3.6}/>
          <Pulse pathId="v2-storage-2" begin=".95s" dur="4.7s" tone="amber"/>
          <Pulse pathId="v2-storage-3" begin="1.8s" dur="5.6s" tone="blue"/>
          <Pulse pathId="v2-edge-1" begin=".55s" dur="4.4s" tone="green"/>
          <Pulse pathId="v2-edge-1" begin="2.7s" dur="6.1s" tone="blue" r={3.5}/>
          <Pulse pathId="v2-edge-2" begin="1.6s" dur="5.2s" tone="blue"/>
        </g>

        <g className={styles.storage}>
          <polygon points="1210,286 1320,224 1487,286 1378,350" className={styles.nodeTop}/>
          <polygon points="1210,286 1378,350 1378,427 1210,364" className={styles.nodeSide}/>
          <polygon points="1378,350 1487,286 1487,363 1378,427" className={styles.nodeSide}/>
          <polygon points="1210,365 1378,428 1378,470 1210,408" className={styles.nodeSide}/>
          <polygon points="1378,428 1487,364 1487,407 1378,470" className={styles.nodeSide}/>
          <ellipse cx="1347" cy="286" rx="28" ry="10" className={styles.disk}/>
          <path d="M1319 286V315M1375 286V315M1319 300C1333 310 1361 310 1375 300M1319 315C1333 325 1361 325 1375 315" className={styles.disk}/>
          <g className={styles.devicePorts}>
            <rect x="1204" y="316.5" width="9" height="11" rx="2" className={styles.devicePort}/>
            <rect x="1204" y="342.5" width="9" height="11" rx="2" className={styles.devicePort}/>
            <rect x="1204" y="368.5" width="9" height="11" rx="2" className={styles.devicePort}/>
          </g>
          <LiveLed cx={1230} cy={321} tone="blue" mode="link" seed={201}/>
          <LiveLed cx={1242} cy={326} tone="blue" mode="activity" seed={202}/>
          <LiveLed cx={1254} cy={331} tone="green" mode="power" seed={203}/>
          <LiveLed cx={1230} cy={380} tone="blue" mode="activity" seed={204}/>
          <LiveLed cx={1242} cy={385} tone="dim" mode="link" seed={205}/>
        </g>

        <g className={styles.edge}>
          <polygon points="1196,680 1332,609 1508,681 1374,758" className={styles.nodeTop}/>
          <polygon points="1196,680 1374,758 1374,817 1196,742" className={styles.nodeSide}/>
          <polygon points="1374,758 1508,681 1508,740 1374,817" className={styles.nodeSide}/>
          <path d="M1324 680l24-13 25 10-24 14zM1349 691l24-14 24 10-24 14z" className={styles.edgeGlyph}/>
          <g className={styles.devicePorts}>
            <rect x="1190" y="698.5" width="9" height="11" rx="2" className={styles.devicePort}/>
            <rect x="1190" y="720.5" width="9" height="11" rx="2" className={styles.devicePort}/>
          </g>
          {Array.from({length:6},(_,i)=><circle key={i} cx={1220+i*10} cy={718+i*4} r="1.5" className={styles.ventDot}/>)}
          <LiveLed cx={1483} cy={728} tone="blue" mode="activity" seed={221}/>
          <LiveLed cx={1493} cy={723} tone="green" mode="power" seed={222}/>
        </g>

        {/* Cabinet shell: every face derives from one front parallelogram + one depth vector. */}
        <g className={styles.rack}>
          <polygon points="625,170 790,91 1015,118 850,197" className={styles.rackTop}/>
          <polygon points="625,170 850,197 850,765 625,738" className={styles.rackFront}/>
          <polygon points="850,197 1015,118 1015,686 850,765" className={styles.rackSide}/>

          {/* Top plane local system: front-width=(225,27), depth=(165,-79). */}
          <g transform="matrix(1 .12 1.178571 -.564286 625 170)" className={styles.topVentPlane}>
            <rect x="48" y="30" width="128" height="72" rx="10" className={styles.ventBoundary}/>
            <g clipPath="url(#rackv2-top-vent-clip)">
              {topDots.map(({row,col})=>(
                <circle key={row+'-'+col} cx={57+col*8.2+(row%2)*2.1} cy={38+row*7.2} r="1.2"/>
              ))}
            </g>
          </g>

          {/* Side panel uses the exact cabinet side-plane transform. */}
          <g transform="matrix(1 -.478788 0 1 850 197)" className={styles.sidePanelPlane}>
            <rect x="15" y="20" width="135" height="528" rx="8" className={styles.sidePanel}/>
            <g className={styles.fanAssembly}>
              <circle cx="82.5" cy="246" r="52" className={styles.fanRingOuter}/>
              <circle cx="82.5" cy="246" r="43" className={styles.fanRingInner}/>
              <path d="M42.5 246H122.5M82.5 206V286" className={styles.fanGuard}/>
              <g className={styles.fanRotor}>
                <path d="M82.5 246C100 228 108 208 98 202C84 205 74 219 74 236C75 242 78 245 82.5 246Z" className={styles.fanBlade}/>
                <path d="M82.5 246C100 228 108 208 98 202C84 205 74 219 74 236C75 242 78 245 82.5 246Z" className={styles.fanBlade} transform="rotate(90 82.5 246)"/>
                <path d="M82.5 246C100 228 108 208 98 202C84 205 74 219 74 236C75 242 78 245 82.5 246Z" className={styles.fanBlade} transform="rotate(180 82.5 246)"/>
                <path d="M82.5 246C100 228 108 208 98 202C84 205 74 219 74 236C75 242 78 245 82.5 246Z" className={styles.fanBlade} transform="rotate(270 82.5 246)"/>
                <circle cx="82.5" cy="246" r="7" className={styles.fanHub}/>
              </g>
            </g>
            <g className={styles.sideVentDots}>
              {sideDots.map(({row,col})=>(
                <circle key={row+'-'+col} cx={48+col*13.8+(row%2)*1.9} cy={365+row*20.5} r="1.25"/>
              ))}
            </g>
          </g>

          <path d="M642 188L834 211V744L642 721Z" className={styles.innerFrame}/>

          {/* Front equipment shares exactly the front-plane affine transform. */}
          <g transform="matrix(1 .12 0 1 625 170)" className={styles.frontEquipment}>
            <RackBlade y={48} index={0}/>
            <RackBlade y={91} index={1}/>
            <RackBlade y={134} index={2}/>
            <RackBlade y={177} index={3}/>

            <g className={styles.switch}>
              <rect x="24" y="228" width="177" height="58" rx="2.5" className={styles.switchFace}/>
              <text x="36" y="247">SWITCH / 10G</text>
              {ports.map(i=>(
                <g key={i}>
                  <rect x={36+(i%9)*16.3} y={i<9?255:269} width="10.6" height="8.7" rx="1.2" className={styles.port}/>
                  <LiveLed
                    cx={41+(i%9)*16.3}
                    cy={i<9?267:281}
                    r={1.45}
                    tone={i%7===0?'amber':i%4===0?'green':'blue'}
                    mode={i%7===0?'warning':i%3===0?'link':'activity'}
                    seed={300+i}
                  />
                </g>
              ))}
            </g>

            <RackBlade y={302} index={4}/>
            <RackBlade y={345} index={5}/>

            <g className={styles.lowerUnit}>
              <rect x="24" y="399" width="177" height="101" rx="3" className={styles.lowerFace}/>
              <rect x="38" y="416" width="70" height="62" rx="2" className={styles.mesh}/>
              <rect x="115" y="416" width="70" height="62" rx="2" className={styles.mesh}/>
              <LiveLed cx={178} cy={431} tone="green" mode="power" seed={361}/>
              <LiveLed cx={178} cy={445} tone="blue" mode="activity" seed={362}/>
              <LiveLed cx={178} cy={459} tone="blue" mode="link" seed={363}/>
            </g>
          </g>

          <g className={styles.rails}>
            <path d="M636 183L636 724M839 205L839 751"/>
            {Array.from({length:20},(_,i)=><circle key={'l'+i} cx="637" cy={202+i*26} r="1.5"/>)}
            {Array.from({length:20},(_,i)=><circle key={'r'+i} cx="839" cy={225+i*26} r="1.5"/>)}
          </g>
        </g>

        <g className={styles.internet}>
          <polygon points="114,461 270,376 421,439 264,528" className={styles.nodeTop}/>
          <polygon points="114,461 264,528 264,569 114,505" className={styles.nodeSide}/>
          <polygon points="264,528 421,439 421,481 264,569" className={styles.nodeSide}/>
          <g className={styles.globe}>
            <ellipse cx="268" cy="451" rx="34" ry="24"/>
            <path d="M234 451H302M268 427V475M246 434C254 444 254 460 246 469M290 434C282 444 282 460 290 469"/>
          </g>
          <g className={styles.devicePorts}>
            <rect x="411" y="444" width="10" height="10" rx="2" className={styles.devicePort}/>
            <rect x="411" y="458" width="10" height="10" rx="2" className={styles.devicePort}/>
            <rect x="411" y="472" width="10" height="10" rx="2" className={styles.devicePort}/>
          </g>
          <LiveLed cx={173} cy={515} tone="blue" mode="link" seed={101}/>
          <LiveLed cx={185} cy={520} tone="blue" mode="activity" seed={102}/>
          <LiveLed cx={197} cy={525} tone="green" mode="power" seed={103}/>
          <LiveLed cx={209} cy={530} tone="blue" mode="activity" seed={104}/>
        </g>

        {/* Internet cables remain in front because they visibly plug into the switch. */}
        <g className={[styles.cables,styles.frontCables].join(' ')}>
          <path id="v2-in-1" d="M421 449 C430 451 438 454 445 458 C470 472 454 548 515 568 C571 585 605 531 629 490 C639 473 647 457 656 451 C660 449 663 448.5 666.3 448.3"/>
          <path id="v2-in-2" d="M421 463 C430 465 438 468 445 472 C472 487 466 570 527 587 C581 602 617 548 642 504 C652 486 661 460 672 452 C676 450.5 679 450.2 682.6 450.3"/>
          <path id="v2-in-3" d="M421 477 C430 480 438 483 446 488 C476 506 482 588 541 603 C595 616 631 560 655 518 C666 499 676 470 688 454 C692 452 695 451.5 698.9 452.2"/>
          <Pulse pathId="v2-in-1" begin=".05s" dur="3.6s" tone="blue"/>
          <Pulse pathId="v2-in-1" begin="2.4s" dur="5.7s" tone="green" r={3.4}/>
          <Pulse pathId="v2-in-2" begin=".82s" dur="4.45s" tone="green"/>
          <Pulse pathId="v2-in-3" begin="1.5s" dur="5.15s" tone="blue"/>
        </g>

        <g className={styles.caption}>
          <text x="77" y="793">GLOBAL REACH.</text>
          <text x="77" y="813">REAL INFRASTRUCTURE.</text>
          <text x="77" y="833">HIGHER POSSIBILITIES.</text>
          <path d="M78 855H102"/>
        </g>
      </svg>
    </figure>
  )
}
