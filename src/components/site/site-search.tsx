'use client'

import { useEffect,useRef,useState } from 'react'

type Props = { locale:'en'|'vi' }

export function SiteSearch({ locale }:Props) {
  const [open,setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()

    const onKey = (event:KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event:PointerEvent) => {
      const target = event.target
      if (target instanceof Node && panelRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('keydown',onKey)
    document.addEventListener('pointerdown',onPointer)
    return () => {
      document.removeEventListener('keydown',onKey)
      document.removeEventListener('pointerdown',onPointer)
    }
  },[open])

  useEffect(() => {
    const shortcut = (event:KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(value => !value)
      }
    }
    document.addEventListener('keydown',shortcut)
    return () => document.removeEventListener('keydown',shortcut)
  },[])

  return (
    <div className="site-search-control">
      <button
        className="site-search-trigger"
        type="button"
        aria-label={locale === 'vi' ? 'Tìm kiếm' : 'Search'}
        aria-expanded={open}
        onPointerDown={event => event.stopPropagation()}
        onClick={() => setOpen(value => !value)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      </button>

      {open && (
        <div className="site-search-popover" ref={panelRef}>
          <form action="/search" method="get">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              ref={inputRef}
              name="q"
              type="search"
              autoComplete="off"
              placeholder={locale === 'vi' ? 'Tìm bài viết, project…' : 'Search writing, projects…'}
            />
            <kbd>ESC</kbd>
          </form>
          <footer>
            <span>{locale === 'vi' ? 'TÌM TRÊN TOÀN WEBSITE' : 'SEARCH THE PUBLIC SITE'}</span>
            <small>⌘/CTRL K</small>
          </footer>
        </div>
      )}
    </div>
  )
}
