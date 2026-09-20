import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = process.cwd()
const CSS = join(ROOT,'src/app/globals.css')
const MARKER = 'TYPOGRAPHY SYSTEM V1'
const SOURCE_EXTENSIONS = new Set(['.ts','.tsx','.js','.jsx','.css'])

function normalizeSelector(value:string) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .replace(/^@media[^{}]+/,'')
    .trim()
}

function splitSelectors(raw:string) {
  return raw.split(',').map(normalizeSelector).filter(Boolean)
}

function parseBlocks(css:string) {
  const blocks:Array<{selectors:string[];body:string}> = []
  const regex=/([^{}]+)\{([^{}]*)\}/g
  let match:RegExpExecArray|null
  while ((match=regex.exec(css))) {
    const selectors=splitSelectors(match[1])
    if (selectors.length) blocks.push({selectors,body:match[2]})
  }
  return blocks
}

function fontNumbers(body:string) {
  const out:number[]=[]
  const declarations=body.match(/(?:font-size|font)\s*:[^;}]+/g) ?? []
  for (const declaration of declarations) {
    for (const match of declaration.matchAll(/(\d+(?:\.\d+)?)px/g)) {
      out.push(Number(match[1]))
    }
  }
  return out
}

function isDiagramSelector(selector:string) {
  return [
    '.stack-spatial',
    '.stack-dot-label',
    '.stack-district',
    '.stack-node-dots',
    '.humming-note text',
    '.humming-score-clef',
  ].some(token=>selector.includes(token))
}

async function walk(dir:string):Promise<string[]> {
  const entries=await readdir(dir,{withFileTypes:true})
  const files:string[]=[]
  for (const entry of entries) {
    if (entry.name==='node_modules' || entry.name==='.next') continue
    const full=join(dir,entry.name)
    if (entry.isDirectory()) files.push(...await walk(full))
    else files.push(full)
  }
  return files
}

const css=await readFile(CSS,'utf8')
const markerIndex=css.indexOf(MARKER)
if (markerIndex<0) {
  console.error('TYPOGRAPHY FAIL: canonical marker not found in globals.css')
  process.exit(1)
}

const legacy=css.slice(0,markerIndex)
const canonical=css.slice(markerIndex)
const canonicalBlocks=parseBlocks(canonical)
const canonicalSelectors=new Set(canonicalBlocks.flatMap(block=>block.selectors))
const violations:string[]=[]
const notes:string[]=[]

// Canonical layer must use semantic tokens, not one-off font-size declarations.
for (const block of canonicalBlocks) {
  const declarations=block.body.match(/font-size\s*:[^;}]+/g) ?? []
  for (const declaration of declarations) {
    if (!declaration.includes('var(--type-')) {
      violations.push(`canonical raw font-size: ${block.selectors.join(', ')} -> ${declaration.trim()}`)
    }
  }
}

// Every legacy tiny/oversized declaration must either be governed by the canonical layer
// or be an explicitly permitted diagram annotation.
for (const block of parseBlocks(legacy)) {
  const sizes=fontNumbers(block.body)
  if (!sizes.length) continue
  for (const selector of block.selectors) {
    const tiny=sizes.some(size=>size<11)
    const huge=sizes.some(size=>size>72)
    if (!tiny && !huge) continue
    if (canonicalSelectors.has(selector)) continue

    const min=Math.min(...sizes)
    const max=Math.max(...sizes)
    if (tiny && isDiagramSelector(selector) && min>=9 && max<=72) {
      notes.push(`diagram exception: ${selector} -> ${sizes.join('/') }px`)
      continue
    }
    violations.push(`legacy outlier not governed: ${selector} -> ${sizes.join('/') }px`)
  }
}

// New component/source code must not create local arbitrary font-size APIs.
const srcFiles=(await walk(join(ROOT,'src'))).filter(file=>{
  const dot=file.lastIndexOf('.')
  return dot>=0 && SOURCE_EXTENSIONS.has(file.slice(dot)) && file!==CSS
})
for (const file of srcFiles) {
  const source=await readFile(file,'utf8')
  const relative=file.slice(ROOT.length+1)
  if (/fontSize\s*:/.test(source)) violations.push(`inline fontSize found: ${relative}`)
  if (/text-\[[0-9.]+(?:px|rem|em)\]/.test(source)) violations.push(`arbitrary text size utility found: ${relative}`)
}

console.log('Typography audit')
console.log(`- canonical selectors: ${canonicalSelectors.size}`)
console.log(`- source files scanned: ${srcFiles.length}`)
console.log(`- documented diagram exceptions: ${notes.length}`)

if (notes.length) {
  for (const note of notes.slice(0,20)) console.log('  NOTE',note)
}

if (violations.length) {
  console.error(`\nTYPOGRAPHY FAIL: ${violations.length} violation(s)`)
  for (const violation of violations) console.error('  -',violation)
  process.exit(1)
}

console.log('TYPOGRAPHY PASS')
