'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const primaryLinks = [
  ['OVERVIEW', '/control'],
  ['CONTENT', '/control/content'],
  ['MEDIA', '/control/assets'],
  ['RUNTIME', '/control/runtime'],
  ['STACK', '/control/stack'],
  ['MUSIC SENSOR', '/control/music-sensor'],
] as const

const secondaryLinks = [
  ['BRAINS', '/control/brains'],
  ['SETTINGS', '/control/settings'],
  ['ACCOUNT', '/control/account'],
  ['AUDIT', '/control/audit'],
] as const

export function ControlNav() {
  const pathname=usePathname()
  const inTraffic=pathname.startsWith('/control/traffic')
  const inCommunity=pathname.startsWith('/control/community')
  const [trafficOpen,setTrafficOpen]=useState(inTraffic)
  const [communityOpen,setCommunityOpen]=useState(inCommunity)

  return (
    <nav>
      {primaryLinks.map(([label,href])=>(
        <Link aria-current={pathname===href?'page':undefined} href={href} key={href}>{label}</Link>
      ))}

      <div className={`control-nav-parent ${trafficOpen?'is-open':''}`}>
        <button
          aria-expanded={trafficOpen}
          aria-controls="control-traffic-children"
          type="button"
          onClick={()=>setTrafficOpen(open=>!open)}
        >
          <span>TRAFFIC</span>
          <i aria-hidden="true">{trafficOpen?'−':'+'}</i>
        </button>
        <div id="control-traffic-children" hidden={!trafficOpen}>
          <Link aria-current={pathname==='/control/traffic'?'page':undefined} href="/control/traffic">Overview</Link>
          <Link aria-current={pathname==='/control/traffic/cv'?'page':undefined} href="/control/traffic/cv">CV</Link>
        </div>
      </div>

      <div className={`control-nav-parent ${communityOpen?'is-open':''}`}>
        <button
          aria-expanded={communityOpen}
          aria-controls="control-community-children"
          type="button"
          onClick={()=>setCommunityOpen(open=>!open)}
        >
          <span>COMMUNITY</span>
          <i aria-hidden="true">{communityOpen?'−':'+'}</i>
        </button>
        <div id="control-community-children" hidden={!communityOpen}>
          <Link aria-current={pathname==='/control/community'?'page':undefined} href="/control/community">Moderation</Link>
          <Link aria-current={pathname==='/control/community/users'?'page':undefined} href="/control/community/users">Users</Link>
        </div>
      </div>

      {secondaryLinks.map(([label,href])=>(
        <Link aria-current={pathname===href?'page':undefined} href={href} key={href}>{label}</Link>
      ))}
    </nav>
  )
}
