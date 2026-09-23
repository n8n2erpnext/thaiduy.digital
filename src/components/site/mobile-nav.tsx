'use client'

import Link from 'next/link'
import { useEffect,useRef,useState } from 'react'
import { usePathname } from 'next/navigation'

type Item={id:string;href:string;label:string}
type Props={items:Item[];locale:'en'|'vi';ariaLabel:string}

export function MobileNav({items,locale,ariaLabel}:Props){
  const pathname=usePathname()
  const [open,setOpen]=useState(false)
  const rootRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(!open) return
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape') setOpen(false)
    }
    const onPointer=(event:PointerEvent)=>{
      if(!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown',onKey)
    document.addEventListener('pointerdown',onPointer)
    return()=>{
      document.removeEventListener('keydown',onKey)
      document.removeEventListener('pointerdown',onPointer)
    }
  },[open])

  return(
    <div className="mobile-nav" ref={rootRef}>
      <button
        className="mobile-nav-trigger"
        type="button"
        aria-label={locale==='vi'?'Mở menu điều hướng':'Open navigation menu'}
        aria-expanded={open}
        onClick={()=>setOpen(value=>!value)}
      >
        <span/><span/><span/>
      </button>
      {open&&(
        <div className="mobile-nav-panel" role="navigation" aria-label={ariaLabel}>
          <span className="mobile-nav-kicker">{locale==='vi'?'ĐIỀU HƯỚNG':'NAVIGATE'}</span>
          <div className="mobile-nav-links">
            {items.map((item,index)=>{
              const active=item.href==='/'?pathname==='/' : pathname.startsWith(item.href)
              return(
                <Link
                  href={item.href}
                  key={item.id}
                  data-active={active?'true':'false'}
                  onClick={()=>setOpen(false)}
                >
                  <span>{String(index+1).padStart(2,'0')}</span>
                  <strong>{item.label}</strong>
                  <em>↗</em>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
