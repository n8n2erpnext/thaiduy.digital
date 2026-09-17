'use client'

import { useEffect, useRef } from 'react'

const nodes = [
  { id: 'mb', label: 'MB', role: 'semantic brain', x: 0.5, y: 0.16 },
  { id: 'lightbi', label: 'LightBI', role: 'data cognition', x: 0.18, y: 0.34 },
  { id: 'remote', label: 'Light Remote', role: 'remote nerve', x: 0.18, y: 0.7 },
  { id: 'core', label: 'ENTITY', role: 'public surface', x: 0.5, y: 0.5 },
  { id: 'sentinel', label: 'Sentinel', role: 'watching sense', x: 0.82, y: 0.34 },
  { id: 'music', label: 'Music Sensor', role: 'acoustic sense', x: 0.82, y: 0.7 },
] as const

const links = [['core','mb'],['core','lightbi'],['core','remote'],['core','sentinel'],['core','music']] as const

export function LivingCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      const box = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = box.width
      height = box.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(255,255,255,.045)'
      for (let x = 0; x < width; x += 32) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke() }
      for (let y = 0; y < height; y += 32) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke() }

      const byId = Object.fromEntries(nodes.map(n => [n.id,n]))
      ctx.strokeStyle = 'rgba(142,232,178,.12)'
      for (const [a,b] of links) {
        const p=byId[a], q=byId[b]; const x1=p.x*width, y1=p.y*height, x2=q.x*width, y2=q.y*height
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.bezierCurveTo((x1+x2)/2,y1,(x1+x2)/2,y2,x2,y2); ctx.stroke()
      }

      for (const n of nodes) {
        const x=n.x*width, y=n.y*height, isCore=n.id==='core'
        const pulse=isCore ? 1 + Math.sin(t/900)*0.08 : 1
        ctx.beginPath(); ctx.arc(x,y,(isCore?8:5)*pulse,0,Math.PI*2)
        ctx.fillStyle=isCore?'rgba(142,232,178,.75)':'rgba(136,146,140,.5)'; ctx.fill()
        if (isCore) { ctx.beginPath(); ctx.arc(x,y,18 + Math.sin(t/900)*3,0,Math.PI*2); ctx.strokeStyle='rgba(142,232,178,.12)'; ctx.stroke() }
        ctx.fillStyle = isCore ? 'rgba(232,239,234,.9)' : 'rgba(182,191,185,.72)'
        ctx.font = `${isCore ? 10 : 9}px ui-monospace, SFMono-Regular, Menlo, monospace`
        ctx.fillText(n.label, x+12, y-2)
        ctx.fillStyle='rgba(113,124,117,.72)'; ctx.font='8px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.fillText(n.role,x+12,y+11)
      }
      raf=requestAnimationFrame(draw)
    }

    resize(); const ro=new ResizeObserver(resize); ro.observe(canvas); raf=requestAnimationFrame(draw)
    return () => { ro.disconnect(); cancelAnimationFrame(raf) }
  }, [])

  return <canvas ref={ref} className="living-canvas" aria-label="Living ecosystem topology prototype; external entity feeds are not connected yet." />
}
