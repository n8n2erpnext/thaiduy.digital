'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Locale } from '@/i18n/config'

type ThemeMode = 'dark' | 'normal'
type Props = { locale: Locale }

const STORAGE_KEY='thaiduy-theme'

function readTheme():ThemeMode {
  if (typeof document==='undefined') return 'dark'
  return document.documentElement.dataset.theme==='normal' ? 'normal' : 'dark'
}

function applyTheme(theme:ThemeMode) {
  const root=document.documentElement
  root.dataset.theme=theme
  root.style.colorScheme=theme==='dark' ? 'dark' : 'light'
  localStorage.setItem(STORAGE_KEY,theme)
  window.dispatchEvent(new Event('thaiduy-theme-change'))
}

function subscribeTheme(callback:()=>void) {
  window.addEventListener('thaiduy-theme-change',callback)
  return ()=>window.removeEventListener('thaiduy-theme-change',callback)
}

function ThemeIcon({ theme }:{ theme:ThemeMode }) {
  if (theme==='normal') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.1"/>
        <path d="M12 3.2v2M12 18.8v2M3.2 12h2M18.8 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.5 15.2A7.2 7.2 0 0 1 8.8 5.5a7.3 7.3 0 1 0 9.7 9.7Z"/>
    </svg>
  )
}

export function ThemeSwitch({ locale }:Props) {
  const theme=useSyncExternalStore(subscribeTheme,readTheme,()=> 'dark' as ThemeMode)
  const [outgoing,setOutgoing]=useState<ThemeMode|null>(null)
  const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(()=>()=> {
    if (timerRef.current) clearTimeout(timerRef.current)
  },[])

  function toggleTheme() {
    if (outgoing) return
    const next:ThemeMode=theme==='dark' ? 'normal' : 'dark'
    setOutgoing(theme)
    applyTheme(next)
    timerRef.current=setTimeout(()=>setOutgoing(null),430)
  }

  const normal=theme==='normal'
  const label=locale==='vi'
    ? (normal ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện thường')
    : (normal ? 'Switch to dark mode' : 'Switch to normal mode')

  return (
    <button
      className="theme-switch-iphone"
      type="button"
      data-theme={theme}
      data-animating={outgoing ? 'true' : 'false'}
      aria-label={label}
      aria-pressed={normal}
      title={label}
      onClick={toggleTheme}
    >
      <span className="theme-icon-stage" aria-hidden="true">
        {outgoing && (
          <span className={'theme-icon theme-icon-out theme-icon-'+outgoing}>
            <ThemeIcon theme={outgoing}/>
          </span>
        )}
        <span className={'theme-icon theme-icon-in theme-icon-'+theme}>
          <ThemeIcon theme={theme}/>
        </span>
      </span>
    </button>
  )
}
