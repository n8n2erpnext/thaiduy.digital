"use client"

import { useEffect, useRef } from 'react'
import { useMusicState } from '@/hooks/use-music-state'
import { useOrganismState } from '@/hooks/use-organism-state'
import type { Locale } from '@/i18n/config'
import type { PublicOrganismState } from '@/lib/organism'
import { messages } from '@/i18n/messages'

type Props = {
  locale: Locale
  initialState: PublicOrganismState
}

export function LivingCanvas({ locale, initialState }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const t = messages[locale].entity
  const music = useMusicState()
  const organism = useOrganismState(initialState)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    let dpr = 1
    let normalTheme = document.documentElement.dataset.theme === 'normal'

    const resize = () => {
      const box = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = box.width
      height = box.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)

      ctx.lineWidth = 1
      ctx.strokeStyle = normalTheme ? 'rgba(24,48,33,.055)' : 'rgba(255,255,255,.04)'
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 32) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      const byId = Object.fromEntries(organism.nodes.map(node => [node.id, node]))

      for (const link of organism.links) {
        const a = byId[link.source]
        const b = byId[link.target]
        if (!a || !b) continue
        const x1 = a.x * width
        const y1 = a.y * height
        const x2 = b.x * width
        const y2 = b.y * height
        const active = [a.state, b.state].some(state => state === 'online' || state === 'degraded')
        ctx.strokeStyle = active
          ? (normalTheme ? 'rgba(22,124,82,.28)' : 'rgba(142,232,178,.18)')
          : (normalTheme ? 'rgba(22,124,82,.12)' : 'rgba(142,232,178,.07)')
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2)
        ctx.stroke()
      }

      for (const node of organism.nodes) {
        const x = node.x * width
        const y = node.y * height
        const isCore = node.id === 'entity-core'
        const isMusic = node.id === 'sentinel-music'
        const liveMusic = isMusic && music.connected
        const state = liveMusic ? 'online' : node.state
        const active = state === 'online' || state === 'degraded'
        const pulse = isCore
          ? 1 + Math.sin(time / 900) * .08
          : active
            ? 1 + Math.sin(time / 620) * .07
            : 1

        ctx.beginPath()
        ctx.arc(x, y, (isCore ? 8 : 5) * pulse, 0, Math.PI * 2)
        ctx.fillStyle = state === 'degraded'
          ? 'rgba(244,197,108,.84)'
          : active
            ? isMusic
              ? 'rgba(240,201,139,.84)'
              : 'rgba(142,232,178,.72)'
            : state === 'private'
              ? 'rgba(127,154,177,.56)'
              : 'rgba(112,123,116,.42)'
        ctx.fill()

        if (isCore) {
          ctx.beginPath()
          ctx.arc(x, y, 18 + Math.sin(time / 900) * 3, 0, Math.PI * 2)
          ctx.strokeStyle = normalTheme ? 'rgba(22,124,82,.18)' : 'rgba(142,232,178,.12)'
          ctx.stroke()
        }

        ctx.fillStyle = normalTheme
          ? (isCore ? 'rgba(25,39,30,.92)' : 'rgba(66,82,72,.8)')
          : (isCore ? 'rgba(232,239,234,.92)' : 'rgba(182,191,185,.76)')
        ctx.font = `${isCore ? 10 : 9}px 'Cascadia Mono', 'Cascadia Code', Consolas, monospace`
        ctx.fillText(node.label, x + 12, y - 2)

        ctx.fillStyle = normalTheme ? 'rgba(91,108,97,.78)' : 'rgba(113,124,117,.74)'
        ctx.font = "8px 'Cascadia Mono', 'Cascadia Code', Consolas, monospace"
        const role = liveMusic && music.connected
          ? `${node.role} · ${music.mode}`
          : node.role
        ctx.fillText(role, x + 12, y + 11)
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const themeObserver = new MutationObserver(()=>{
      normalTheme = document.documentElement.dataset.theme === 'normal'
    })
    themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
    raf = requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      themeObserver.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [music.connected, music.mode, organism])

  return <canvas ref={ref} className="living-canvas" aria-label={t.canvasAria} />
}
