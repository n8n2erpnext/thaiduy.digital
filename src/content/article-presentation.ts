import sanitizeHtml from 'sanitize-html'
import { codeToHtml } from 'shiki'

export type ArticleTocItem = {
  id:string
  level:2 | 3
  label:string
}

function textOnly(value: string) {
  return sanitizeHtml(value,{
    allowedTags:[],
    allowedAttributes:{},
  }).replace(/\s+/g,' ').trim()
}

function headingId(value: string) {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'')
    .slice(0,72)
  return base || 'section'
}
function decodeCode(value: string) {
  return value
    .replace(/&#(\d+);/g,(_match,n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_match,n) => String.fromCodePoint(parseInt(n,16)))
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&amp;/g,'&')
}

async function highlightCodeBlocks(html: string) {
  const supported:Record<string,{ lang:string; label:string }> = {
    html:{ lang:'html',label:'HTML' },
    xml:{ lang:'html',label:'HTML' },
    css:{ lang:'css',label:'CSS' },
    bash:{ lang:'bash',label:'SHELL' },
    shell:{ lang:'bash',label:'SHELL' },
    python:{ lang:'python',label:'PYTHON' },
    javascript:{ lang:'javascript',label:'JS' },
    typescript:{ lang:'typescript',label:'TS' },
    json:{ lang:'json',label:'JSON' },
    sql:{ lang:'sql',label:'SQL' },
  }

  const pattern = /<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/gi
  const matches = [...html.matchAll(pattern)]
  if (!matches.length) return html

  let cursor = 0
  let output = ''
  for (const match of matches) {
    const index = match.index ?? 0
    output += html.slice(cursor,index)
    const spec = supported[match[1].toLowerCase()]
    if (!spec) {
      output += match[0]
    } else {
      const highlighted = await codeToHtml(decodeCode(match[2]),{
        lang:spec.lang,
        theme:'github-dark-default',
      })
      output += highlighted.replace('<pre ','<pre data-language="' + spec.label + '" ')
    }
    cursor = index + match[0].length
  }
  return output + html.slice(cursor)
}

export async function prepareArticleBody(html: string) {
  const seen = new Map<string,number>()
  const toc: ArticleTocItem[] = []

  const withHeadings = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_match,rawLevel,rawAttrs,inner) => {
      const level = Number(rawLevel) as 2 | 3
      const label = textOnly(inner)
      const base = headingId(label)
      const count = (seen.get(base) ?? 0) + 1
      seen.set(base,count)
      const id = count === 1 ? base : base + '-' + count
      toc.push({ id,level,label })
      const attrs = String(rawAttrs).replace(/\s+id=(?:"[^"]*"|'[^']*')/i,'')
      return '<h' + level + attrs + ' id="' + id + '">' + inner + '</h' + level + '>'
    },
  )

  const text = textOnly(withHeadings)
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0
  const readingMinutes = Math.max(1,Math.ceil(words / 220))
  const body = await highlightCodeBlocks(withHeadings)

  return { body,toc,words,readingMinutes }
}
