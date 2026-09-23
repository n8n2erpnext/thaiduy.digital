'use client'

import { useEffect,useMemo,useRef,useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

type Viewer={name:string;image:string|null;isOwner:boolean}
type Props={locale:'en'|'vi';viewer:Viewer|null}
type CommandItem={
  id:string
  group:string
  label:string
  icon:'login'|'account'|'discussions'|'logout'|'control'|'link'|'code'|'github'
  action:()=>unknown|Promise<unknown>
}

function CommandIcon() {
  return (
    <svg viewBox="0 -960 960 960" aria-hidden="true">
      <path d="M260-120q-58 0-99-41t-41-99q0-58 41-99t99-41h60v-160h-60q-58 0-99-41t-41-99q0-58 41-99t99-41q58 0 99 41t41 99v60h160v-60q0-58 41-99t99-41q58 0 99 41t41 99q0 58-41 99t-99 41h-60v160h60q58 0 99 41t41 99q0 58-41 99t-99 41q-58 0-99-41t-41-99v-60H400v60q0 58-41 99t-99 41Zm0-80q25 0 42.5-17.5T320-260v-60h-60q-25 0-42.5 17.5T200-260q0 25 17.5 42.5T260-200Zm440 0q25 0 42.5-17.5T760-260q0-25-17.5-42.5T700-320h-60v60q0 25 17.5 42.5T700-200ZM400-400h160v-160H400v160ZM260-640h60v-60q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm380 0h60q25 0 42.5-17.5T760-700q0-25-17.5-42.5T700-760q-25 0-42.5 17.5T640-700v60Z"/>
    </svg>
  )
}

function ItemIcon({kind}:{kind:CommandItem['icon']}) {
  if(kind==='login') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v14h-5M11 8l4 4-4 4M15 12H4"/></svg>
  if(kind==='account') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></svg>
  if(kind==='discussions') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5"/></svg>
  if(kind==='logout') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M13 8l4 4-4 4M8 12h9"/></svg>
  if(kind==='control') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 9h8M8 13h5"/></svg>
  if(kind==='link') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 14.5 14.5 9M7.2 17.7l-1 .9a4 4 0 0 1-5.6-5.6l3-3a4 4 0 0 1 5.6 0M16.8 6.3l1-.9a4 4 0 0 1 5.6 5.6l-3 3a4 4 0 0 1-5.6 0"/></svg>
  if(kind==='code') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5-6 7 6 7M16 5l6 7-6 7"/></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2.3c-3.4.7-4.1-1.4-4.1-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6a4.7 4.7 0 0 1 1.2-3.2 4.3 4.3 0 0 1 .1-3.2s1-.3 3.2 1.2a11.1 11.1 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2a4.3 4.3 0 0 1 .1 3.2 4.7 4.7 0 0 1 1.2 3.2c0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .7Z"/></svg>
}

export function HeaderCommand({locale,viewer}:Props) {
  const vi=locale==='vi'
  const router=useRouter()
  const [open,setOpen]=useState(false)
  const [query,setQuery]=useState('')
  const panelRef=useRef<HTMLDivElement>(null)
  const inputRef=useRef<HTMLInputElement>(null)

  useEffect(()=>{
    if(!open) return
    inputRef.current?.focus()
    const previousOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    const close=(event:KeyboardEvent)=>event.key==='Escape'&&setOpen(false)
    document.addEventListener('keydown',close)
    return()=>{
      document.removeEventListener('keydown',close)
      document.body.style.overflow=previousOverflow
    }
  },[open])

  const commands=useMemo<CommandItem[]>(()=>{
    const accountGroup=vi?'Tài khoản':'Account'
    const accountCommands:CommandItem[]=viewer
      ? [
          {
            id:'account',group:accountGroup,
            label:(vi?'Tài khoản · ':'My account · ')+viewer.name,icon:'account',
            action:()=>{setOpen(false);router.push('/account')},
          },
          {
            id:'my-discussions',group:accountGroup,
            label:vi?'Nội dung của tôi':'My discussions',icon:'discussions',
            action:()=>{setOpen(false);router.push('/account/discussions')},
          },
          ...(viewer.isOwner?[{
            id:'control',group:accountGroup,
            label:vi?'Bảng điều khiển':'Control',icon:'control' as const,
            action:()=>{setOpen(false);router.push('/control')},
          }]:[]),
          {
            id:'sign-out',group:accountGroup,
            label:vi?'Đăng xuất':'Sign out',icon:'logout',
            action:async()=>authClient.signOut({
              fetchOptions:{onSuccess:()=>{setOpen(false);router.refresh()}},
            }),
          },
        ]
      : [{
          id:'sign-in',group:accountGroup,
          label:vi?'Đăng nhập':'Sign in',icon:'login',
          action:async()=>authClient.signIn.social({
            provider:'google',
            callbackURL:window.location.pathname+window.location.search,
          }),
        }]

    return [
      ...accountCommands,
      {
        id:'copy-link',group:vi?'Chung':'General',
        label:vi?'Sao chép liên kết':'Copy link',icon:'link',
        action:async()=>{await navigator.clipboard.writeText(window.location.href);setOpen(false)},
      },
      {
        id:'source',group:vi?'Chung':'General',
        label:vi?'Mã nguồn':'Source code',icon:'code',
        action:()=>window.open('https://github.com/n8n2erpnext/thaiduy.digital','_blank','noopener,noreferrer'),
      },
      {
        id:'github',group:'Social',
        label:'GitHub',icon:'github',
        action:()=>window.open('https://github.com/n8n2erpnext','_blank','noopener,noreferrer'),
      },
    ]
  },[router,vi,viewer])

  const normalized=query.trim().toLowerCase()
  const visible=normalized
    ? commands.filter(item=>item.label.toLowerCase().includes(normalized)||item.group.toLowerCase().includes(normalized))
    : commands

  function runSearch() {
    if(!query.trim()) return
    router.push('/search?q='+encodeURIComponent(query.trim()))
    setOpen(false)
  }

  function submitSearch(event:React.FormEvent) {
    event.preventDefault()
    runSearch()
  }

  return (
    <div className="header-command-control">
      <button
        className="header-command-trigger"
        type="button"
        aria-label={vi?'Mở bảng lệnh':'Open command palette'}
        aria-expanded={open}
        onClick={()=>setOpen(true)}
      >
        <CommandIcon/>
      </button>

      {open&&createPortal(
        <div className="header-command-backdrop" onPointerDown={()=>setOpen(false)}>
          <div className="header-command-panel" ref={panelRef} onPointerDown={event=>event.stopPropagation()} role="dialog" aria-modal="true">
            <form className="header-command-search" onSubmit={submitSearch}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
              <input ref={inputRef} value={query} onChange={event=>setQuery(event.target.value)} placeholder={vi?'Nhập lệnh hoặc tìm kiếm':'Type a command or search'}/>
            </form>

            <div className="header-command-list">
              {[...new Set(visible.map(item=>item.group))].map(group=>(
                <section key={group}>
                  <h3>{group}</h3>
                  {visible.filter(item=>item.group===group).map(item=>(
                    <button key={item.id} type="button" onClick={()=>void item.action()}>
                      <ItemIcon kind={item.icon}/>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </section>
              ))}
              {visible.length===0&&query.trim()&&(
                <button className="header-command-search-action" type="button" onClick={runSearch}>
                  <span>{vi?'Tìm trên website':'Search site'}: “{query.trim()}”</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
