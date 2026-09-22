'use client'

import { useEffect,useMemo,useRef,useState } from 'react'
import {
  COMMUNITY_REACTION_META,
  COMMUNITY_REACTIONS,
  EMPTY_REACTION_SUMMARY,
  type CommunityReaction,
  type CommunityReactionSummary,
} from '@/community/reactions'
import { authClient } from '@/lib/auth-client'

const HOLD_MS=450

type Props={
  kind:'thread'|'reply'
  id:string
  locale:'en'|'vi'
  initialReaction:CommunityReaction|null
  initialCount:number
  initialSummary:CommunityReactionSummary
  canReact:boolean
  blocked:boolean
}

export function DiscussReactionButton({
  kind,
  id,
  locale,
  initialReaction,
  initialCount,
  initialSummary,
  canReact,
  blocked,
}:Props) {
  const vi=locale==='vi'
  const [reaction,setReaction]=useState<CommunityReaction|null>(initialReaction)
  const [count,setCount]=useState(initialCount)
  const [summary,setSummary]=useState<CommunityReactionSummary>({
    ...EMPTY_REACTION_SUMMARY,
    ...initialSummary,
  })
  const [pending,setPending]=useState(false)
  const [pickerOpen,setPickerOpen]=useState(false)

  const rootRef=useRef<HTMLDivElement>(null)
  const holdTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  const suppressClick=useRef(false)

  useEffect(()=>{
    function closeOnOutside(event:PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setPickerOpen(false)
    }
    function closeOnEscape(event:KeyboardEvent) {
      if (event.key==='Escape') setPickerOpen(false)
    }
    document.addEventListener('pointerdown',closeOnOutside)
    document.addEventListener('keydown',closeOnEscape)
    return ()=>{
      document.removeEventListener('pointerdown',closeOnOutside)
      document.removeEventListener('keydown',closeOnEscape)
      if (holdTimer.current) clearTimeout(holdTimer.current)
    }
  },[])

  const visibleSummary=useMemo(
    ()=>COMMUNITY_REACTIONS
      .map(key=>({key,count:Number(summary[key] ?? 0)}))
      .filter(item=>item.count>0)
      .sort((a,b)=>b.count-a.count)
      .slice(0,3),
    [summary],
  )

  async function googleLogin() {
    await authClient.signIn.social({
      provider:'google',
      callbackURL:window.location.pathname+window.location.search,
    })
  }

  async function choose(next:CommunityReaction) {
    if (!canReact) return void googleLogin()
    if (blocked || pending) return

    setPending(true)
    try {
      const response=await fetch('/api/discuss/likes',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({kind,id,reaction:next}),
      })
      const payload=await response.json() as {
        reaction?:CommunityReaction|null
        reactionCount?:number
        reactionSummary?:CommunityReactionSummary
        error?:string
      }
      if (response.ok) {
        setReaction(payload.reaction ?? null)
        setCount(Number(payload.reactionCount ?? 0))
        setSummary({
          ...EMPTY_REACTION_SUMMARY,
          ...(payload.reactionSummary ?? {}),
        })
        setPickerOpen(false)
      } else if (payload.error==='auth_required' || payload.error==='google_required') {
        await googleLogin()
      }
    } finally {
      setPending(false)
    }
  }

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current=null
    }
  }

  function startHold() {
    if (blocked || pending) return
    clearHold()
    suppressClick.current=false
    holdTimer.current=setTimeout(()=>{
      suppressClick.current=true
      setPickerOpen(true)
      holdTimer.current=null
    },HOLD_MS)
  }

  function clickPrimary() {
    if (suppressClick.current) {
      suppressClick.current=false
      return
    }
    void choose('like')
  }

  const selectedMeta=reaction?COMMUNITY_REACTION_META[reaction]:null
  const buttonLabel=selectedMeta
    ? (vi?selectedMeta.labelVi:selectedMeta.labelEn)
    : (vi?'Thích':'Like')

  return (
    <div className="discuss-reaction-control" ref={rootRef}>
      <button
        className="discuss-like"
        data-reacted={reaction || undefined}
        type="button"
        disabled={pending || blocked}
        aria-haspopup="menu"
        aria-expanded={pickerOpen}
        onPointerDown={startHold}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        onPointerLeave={clearHold}
        onClick={clickPrimary}
        onContextMenu={event=>event.preventDefault()}
        title={blocked
          ? (vi?'Tài khoản này hiện không thể tương tác':'This account cannot currently interact')
          : (vi?'Bấm để Thích · Giữ để chọn cảm xúc':'Click to Like · Hold for reactions')}
      >
        <span className="discuss-reaction-summary" aria-hidden="true">
          {visibleSummary.length
            ? visibleSummary.map(item=>(
                <i key={item.key}>{COMMUNITY_REACTION_META[item.key].emoji}</i>
              ))
            : <i>{selectedMeta?.emoji ?? '♡'}</i>}
        </span>
        <strong>{count}</strong>
        <small>{buttonLabel.toUpperCase()}</small>
      </button>

      {pickerOpen && (
        <div
          className="discuss-reaction-picker"
          role="menu"
          aria-label={vi?'Chọn cảm xúc':'Choose reaction'}
          onPointerDown={event=>event.stopPropagation()}
        >
          {COMMUNITY_REACTIONS.map(key=>{
            const meta=COMMUNITY_REACTION_META[key]
            const selected=reaction===key
            return (
              <button
                type="button"
                role="menuitem"
                key={key}
                data-selected={selected || undefined}
                disabled={pending || blocked}
                title={vi?meta.labelVi:meta.labelEn}
                onClick={()=>void choose(key)}
              >
                <span aria-hidden="true">{meta.emoji}</span>
                <small>{vi?meta.labelVi:meta.labelEn}</small>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
