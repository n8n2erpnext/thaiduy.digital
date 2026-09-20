'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ArticleTocItem } from '@/content/article-presentation'

type Props = {
  toc:ArticleTocItem[]
  articleId:string
  label:string
}

export function ArticleReader({ toc,articleId,label }: Props) {
  const [progress,setProgress] = useState(0)
  const [activeId,setActiveId] = useState(toc[0]?.id ?? '')

  const ids = useMemo(() => toc.map(item => item.id),[toc])

  useEffect(() => {
    const article = document.getElementById(articleId)
    if (!article) return

    const update = () => {
      const rect = article.getBoundingClientRect()
      const articleTop = window.scrollY + rect.top
      const articleBottom = articleTop + article.offsetHeight
      const start = articleTop - 90
      const end = Math.max(start + 1,articleBottom - window.innerHeight * .72)
      const value = (window.scrollY - start) / (end - start)
      setProgress(Math.max(0,Math.min(1,value)))

      let current = ids[0] ?? ''
      for (const id of ids) {
        const heading = document.getElementById(id)
        if (!heading) continue
        const top = heading.getBoundingClientRect().top
        if (top <= 180) current = id
        else break
      }
      setActiveId(current)
    }
    update()
    window.addEventListener('scroll',update,{ passive:true })
    window.addEventListener('resize',update)
    return () => {
      window.removeEventListener('scroll',update)
      window.removeEventListener('resize',update)
    }
  },[articleId,ids])

  return (
    <>
      <div className="writing-reading-progress" aria-hidden="true">
        <i style={{ transform:'scaleX(' + progress + ')' }} />
      </div>

      {toc.length > 0 && (
        <aside className="writing-toc" aria-label={label}>
          <div className="writing-toc-head">
            <span>{label}</span>
            <em>{Math.round(progress * 100)}%</em>
          </div>
          <nav>
            {toc.map(item => (
              <a
                key={item.id}
                href={'#' + item.id}
                data-level={item.level}
                data-active={activeId === item.id || undefined}
                onClick={event => {
                  event.preventDefault()
                  document.getElementById(item.id)?.scrollIntoView({
                    behavior:'smooth',
                    block:'start',
                  })
                  history.replaceState(null,'','#' + item.id)
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
      )}
    </>
  )
}
