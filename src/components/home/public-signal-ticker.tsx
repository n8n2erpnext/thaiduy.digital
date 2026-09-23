'use client'

import { useEffect,useMemo,useRef,useState,type CSSProperties } from 'react'

type Props={
  locale:'en'|'vi'
  repoCount:number
  commitCount:number
  online:number
  nodeCount:number
  linkCount:number
  active30d:number
  currentRepoName:string
}

export function PublicSignalTicker({
  locale,
  repoCount,
  commitCount,
  online,
  nodeCount,
  linkCount,
  active30d,
  currentRepoName,
}:Props) {
  const containerRef=useRef<HTMLDivElement>(null)
  const setRef=useRef<HTMLDivElement>(null)
  const [copies,setCopies]=useState(6)
  const [ready,setReady]=useState(false)
  const items=useMemo(()=>[
    repoCount+' '+(locale==='vi'?'REPO CÔNG KHAI':'PUBLIC REPOS'),
    commitCount+' '+(locale==='vi'?'COMMIT / 53 TUẦN':'COMMITS / 53W'),
    online+'/'+nodeCount+' '+(locale==='vi'?'NODE ONLINE':'NODES ONLINE'),
    linkCount+' '+(locale==='vi'?'LIÊN KẾT LIVE':'LIVE LINKS'),
    active30d+' '+(locale==='vi'?'REPO HOẠT ĐỘNG / 30 NGÀY':'ACTIVE REPOS / 30D'),
    (locale==='vi'?'PUSH GẦN NHẤT':'LATEST PUSH')+' · '+currentRepoName,
  ],[active30d,commitCount,currentRepoName,linkCount,locale,nodeCount,online,repoCount])

  useEffect(()=>{
    const measure=()=>{
      const container=containerRef.current
      const set=setRef.current
      if(!container||!set) return
      const setWidth=set.getBoundingClientRect().width
      if(setWidth<=0) return
      const needed=Math.max(4,Math.ceil(container.clientWidth/setWidth)+2)
      setCopies(current=>current===needed?current:needed)
      setReady(true)
    }
    measure()
    const observer=new ResizeObserver(measure)
    if(containerRef.current) observer.observe(containerRef.current)
    if(setRef.current) observer.observe(setRef.current)
    return()=>observer.disconnect()
  },[items])

  return (
    <div
      ref={containerRef}
      className="home-public-signal-ticker"
      aria-label={locale==='vi'?'Tín hiệu công khai đang chạy':'Live public signals'}
    >
      <div
        className="home-public-signal-track"
        data-ready={ready?'true':'false'}
        style={{'--home-signal-shift':(-100/copies)+'%'} as CSSProperties}
      >
        {Array.from({length:copies},(_,copy)=>(
          <div
            className="home-public-signal-set"
            aria-hidden="true"
            key={copy}
            ref={copy===0?setRef:undefined}
          >
            {items.map((item,index)=>(
              <span className="home-public-signal-item" key={index}>
                <b>{item}</b>
                <i/>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
