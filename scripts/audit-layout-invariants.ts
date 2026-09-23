import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const css=await readFile(join(process.cwd(),'src/app/globals.css'),'utf8')

function blockBodies(selector:string) {
  const escaped=selector.replace(/[.*+?^$()|[\]\\]/g,'\\$&')
  const regex=new RegExp(escaped+'\\s*\\{([^{}]*)\\}','g')
  return [...css.matchAll(regex)].map(match=>match[1])
}

function lastDeclaration(selector:string,property:string) {
  const bodies=blockBodies(selector)
  let value:string|undefined
  for (const body of bodies) {
    const regex=new RegExp('(?:^|;)\\s*'+property.replace('-','\\-')+'\\s*:\\s*([^;}]+)','g')
    for (const match of body.matchAll(regex)) value=match[1].trim()
  }
  return value
}

const failures:string[]=[]

const baseHeaderPosition=lastDeclaration('.site-header','position')
if (baseHeaderPosition!=='sticky') {
  failures.push('.site-header final position must be sticky, got '+(baseHeaderPosition ?? 'missing'))
}

for (const selector of ['.site-shell','.home-public-shell','.home-public-page']) {
  for (const prop of ['overflow','overflow-y']) {
    const value=lastDeclaration(selector,prop)
    if (value && /hidden|auto|scroll|clip/.test(value)) {
      failures.push(selector+' '+prop+'='+value+' can break sticky header behavior')
    }
  }
}

const headerZ=Number.parseInt(lastDeclaration('.site-header','z-index') ?? '0',10)
if (!Number.isFinite(headerZ) || headerZ<20) {
  failures.push('.site-header z-index must remain >=20, got '+headerZ)
}

const atmosphereZ=Number.parseInt(lastDeclaration('.top-atmosphere','z-index') ?? '0',10)
if (Number.isFinite(atmosphereZ) && atmosphereZ>=headerZ) {
  failures.push('.top-atmosphere z-index ('+atmosphereZ+') must stay below sticky header ('+headerZ+')')
}

const atmosphereWidth=lastDeclaration('.top-atmosphere','width')
if (atmosphereWidth!=='100%') {
  failures.push('.top-atmosphere width must remain 100% of full-page wrapper, got '+(atmosphereWidth ?? 'missing'))
}
if (/vw/.test(atmosphereWidth ?? '')) {
  failures.push('.top-atmosphere must not use vw units; desktop scrollbar width can create horizontal overflow')
}
const atmosphereLeft=lastDeclaration('.top-atmosphere','left')
if (atmosphereLeft!=='0') {
  failures.push('.top-atmosphere left must remain 0, got '+(atmosphereLeft ?? 'missing'))
}

console.log('Layout invariant audit')
console.log('- base header position: '+baseHeaderPosition)
console.log('- header z-index: '+headerZ)
console.log('- atmosphere z-index: '+atmosphereZ)
console.log('- atmosphere width: '+atmosphereWidth)
console.log('- atmosphere left: '+atmosphereLeft)

if (failures.length) {
  console.error('LAYOUT FAIL: '+failures.length+' violation(s)')
  for (const failure of failures) console.error('  -',failure)
  process.exit(1)
}

console.log('LAYOUT PASS')
