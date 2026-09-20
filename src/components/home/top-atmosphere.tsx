'use client'

import { useEffect, useRef } from 'react'

export function TopAtmosphere() {
  const ref=useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    const node=ref.current
    if (!node) return
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let targetX=0
    let targetY=0
    let currentX=0
    let currentY=0
    let frame=0

    const onPointer=(event:PointerEvent)=>{
      targetX=(event.clientX/window.innerWidth-.5)*2
      targetY=(event.clientY/window.innerHeight-.5)*2
    }

    const tick=()=>{
      currentX+=(targetX-currentX)*.055
      currentY+=(targetY-currentY)*.055
      node.style.setProperty('--atmo-x',currentX.toFixed(4))
      node.style.setProperty('--atmo-y',currentY.toFixed(4))
      frame=requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove',onPointer,{passive:true})
    frame=requestAnimationFrame(tick)
    return ()=>{
      window.removeEventListener('pointermove',onPointer)
      cancelAnimationFrame(frame)
    }
  },[])

  return (
    <div ref={ref} className="top-atmosphere" aria-hidden="true">
      <div className="top-atmosphere-grid"/>
      <div className="top-atmosphere-beam"/>
      <div className="top-atmosphere-orb orb-a"/>
      <div className="top-atmosphere-orb orb-b"/>
      <div className="top-atmosphere-orb orb-c"/>
      <div className="top-atmosphere-orb orb-d"/>
      <div className="top-atmosphere-orb orb-e"/>
      <div className="top-atmosphere-cursor"/>
      <div className="top-atmosphere-fade"/>
    </div>
  )
}
