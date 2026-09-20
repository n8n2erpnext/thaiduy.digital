import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT=process.cwd()
const CSS=join(ROOT,'src/app/globals.css')
const css=await readFile(CSS,'utf8')

type Block={ selectors:string[]; body:string }

function normalize(value:string) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g,' ')
    .replace(/\s+/g,' ')
    .trim()
}

function blocks(source:string):Block[] {
  const out:Block[]=[]
  const regex=/([^{}]+)\{([^{}]*)\}/g
  let match:RegExpExecArray|null
  while ((match=regex.exec(source))) {
    const selectors=match[1].split(',').map(normalize).filter(Boolean)
    if (selectors.length) out.push({selectors,body:match[2]})
  }
  return out
}

function stripNormal(selector:string) {
  return selector
    .replace(/^html\[data-theme=['"]normal['"]\]\s*/,'')
    .trim()
}

function hexLuminance(hex:string) {
  let raw=hex.replace('#','')
  if (raw.length===3) raw=raw.split('').map(char=>char+char).join('')
  if (raw.length<6) return 0
  const rgb=[0,2,4].map(offset=>Number.parseInt(raw.slice(offset,offset+2),16)/255)
  const linear=rgb.map(channel=>channel<=.04045?channel/12.92:Math.pow((channel+.055)/1.055,2.4))
  return .2126*linear[0]+.7152*linear[1]+.0722*linear[2]
}

function contrastRatio(foreground:string,background:string) {
  const a=hexLuminance(foreground)
  const b=hexLuminance(background)
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)
}

function isBrightTextPaint(value:string) {
  const hexes=[...value.matchAll(/#([0-9a-fA-F]{6})/g)].map(match=>'#'+match[1])
  if (hexes.some(hex=>hexLuminance(hex)>.38)) return true
  const rgba=[...value.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/g)]
  return rgba.some(match=>{
    const [r,g,b]=[Number(match[1]),Number(match[2]),Number(match[3])]
    const alpha=match[4]===undefined?1:Number(match[4])
    return r>190 && g>190 && b>190 && alpha>.2
  })
}

function isDarkSurface(value:string) {
  const hexes=[...value.matchAll(/#([0-9a-fA-F]{6})/g)].map(match=>'#'+match[1])
  if (hexes.some(hex=>hexLuminance(hex)<.08)) return true
  const rgba=[...value.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)]
  return rgba.some(match=>{
    const [r,g,b]=[Number(match[1]),Number(match[2]),Number(match[3])]
    return r<42 && g<42 && b<42
  })
}

function isLightPaint(value:string) {
  const hexes=[...value.matchAll(/#([0-9a-fA-F]{6})/g)].map(match=>'#'+match[1])
  if (hexes.some(hex=>hexLuminance(hex)>.68)) return true
  const rgba=[...value.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/g)]
  return rgba.some(match=>{
    const [r,g,b]=[Number(match[1]),Number(match[2]),Number(match[3])]
    const alpha=match[4]===undefined?1:Number(match[4])
    return r>205 && g>205 && b>205 && alpha>.02
  })
}

function selectorIsPublic(selector:string) {
  return !selector.includes('.control-')
    && !selector.includes('.cms-')
    && !selector.includes("html[data-theme=")
}

function intentionallyDark(selector:string) {
  return selector.includes('writing-article-body pre')
    || selector.includes('writing-post-cover .writing-photo-credit')
    || selector.includes('writing-article-cover .writing-photo-credit')
    || selector.includes('.writing-photo-credit a')
}

function legacyDeadSelector(selector:string) {
  return selector.includes('.theme-switch-thumb')
    || selector.includes('.theme-switch-horizon')
}

const all=blocks(css)
const normalSelectors=new Set<string>()

for (const block of all) {
  for (const selector of block.selectors) {
    if (/^html\[data-theme=['"]normal['"]\]/.test(selector)) {
      normalSelectors.add(stripNormal(selector))
    }
  }
}

function covered(selector:string) {
  return normalSelectors.has(selector)
}

const brightTextIssues:string[]=[]
const darkSurfaceIssues:string[]=[]
const lightBorderIssues:string[]=[]
const lightSvgIssues:string[]=[]

for (const block of all) {
  for (const selector of block.selectors) {
    if (!selectorIsPublic(selector) || legacyDeadSelector(selector)) continue

    const textColors=[...block.body.matchAll(/(?<!background-)color\s*:\s*([^;}]+)/g)]
      .map(match=>match[1].trim())
      .filter(isBrightTextPaint)

    if (textColors.length && !covered(selector) && !intentionallyDark(selector)) {
      brightTextIssues.push(`${selector} -> ${textColors.join(', ')}`)
    }

    const surfaces=[
      ...[...block.body.matchAll(/(?<!-)\bbackground\s*:\s*([^;}]+)/g)].map(match=>match[1].trim()),
      ...[...block.body.matchAll(/\bbackground-color\s*:\s*([^;}]+)/g)].map(match=>match[1].trim()),
    ].filter(isDarkSurface)

    if (surfaces.length && !covered(selector) && !intentionallyDark(selector)) {
      if (!selector.includes('.top-atmosphere-fade')) {
        darkSurfaceIssues.push(`${selector} -> ${surfaces.join(' | ')}`)
      }
    }

    const borders=[
      ...[...block.body.matchAll(/\bborder(?:-(?:top|right|bottom|left))?(?:-color)?\s*:\s*([^;}]+)/g)]
        .map(match=>match[1].trim()),
    ].filter(isLightPaint)

    if (borders.length && !covered(selector) && !intentionallyDark(selector)) {
      lightBorderIssues.push(`${selector} -> ${borders.join(' | ')}`)
    }

    const svgPaint=[
      ...[...block.body.matchAll(/\b(?:stroke|fill)\s*:\s*([^;}]+)/g)]
        .map(match=>match[1].trim()),
    ].filter(isLightPaint)

    if (svgPaint.length && !covered(selector) && !intentionallyDark(selector)) {
      lightSvgIssues.push(`${selector} -> ${svgPaint.join(' | ')}`)
    }
  }
}

const semanticIssues:string[]=[]
const normalThemeBlock=all.find(block=>block.selectors.length===1 && block.selectors[0]==="html[data-theme='normal']")
const themeVars=new Map<string,string>()
if (normalThemeBlock) {
  for (const match of normalThemeBlock.body.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
    themeVars.set(match[1],match[2])
  }
}
const background=themeVars.get('--bg')
if (!background) semanticIssues.push('Normal --bg is missing')
else {
  const required:[string,number][]=[
    ['--text-strong',7],
    ['--text-body',7],
    ['--text-secondary',4.5],
    ['--text-meta',4.5],
    ['--link',4.5],
  ]
  for (const [name,minimum] of required) {
    const value=themeVars.get(name)
    if (!value) {
      semanticIssues.push(name+' is missing from Normal theme')
      continue
    }
    const ratio=contrastRatio(value,background)
    if (ratio<minimum) semanticIssues.push(name+' contrast '+ratio.toFixed(2)+':1 is below '+minimum+':1')
  }
}

const controlIsolation=all.find(block=>
  block.selectors.includes("html[data-theme='normal'] .control-root")
  && block.selectors.includes("html[data-theme='normal'] .control-login")
  && /color-scheme\s*:\s*dark/.test(block.body)
  && /--text\s*:\s*#f2f5f2/i.test(block.body)
)
if (!controlIsolation) semanticIssues.push('Control dark-isolation contract is missing')

console.log('Theme contrast audit')
console.log(`- Normal-mode selectors: ${normalSelectors.size}`)
console.log(`- uncovered bright text: ${brightTextIssues.length}`)
console.log(`- uncovered dark surfaces: ${darkSurfaceIssues.length}`)
console.log(`- uncovered light borders: ${lightBorderIssues.length}`)
console.log(`- uncovered light SVG paint: ${lightSvgIssues.length}`)
console.log(`- semantic/control contract issues: ${semanticIssues.length}`)

const failures=[
  ['Bright text leaking into Normal mode',brightTextIssues],
  ['Dark surfaces leaking into Normal mode',darkSurfaceIssues],
  ['Light/Dark-mode borders leaking into Normal mode',lightBorderIssues],
  ['Light SVG stroke/fill leaking into Normal mode',lightSvgIssues],
  ['Semantic palette / control isolation issues',semanticIssues],
] as const

let failed=false
for (const [title,issues] of failures) {
  if (!issues.length) continue
  failed=true
  console.error('\n'+title+':')
  for (const issue of issues) console.error('  -',issue)
}

if (failed) process.exit(1)
console.log('THEME CONTRAST PASS')
