'use client'

import { useMemo, useState } from 'react'

type Props = {
  name?:string
  defaultValue?:string
}

function normalize(value:string) {
  const raw=value.trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(raw) ? raw : '#D6F0E0'
}

function textColor(color:string) {
  const hex=normalize(color).slice(1)
  const [r,g,b]=[0,2,4].map(offset=>Number.parseInt(hex.slice(offset,offset+2),16)/255)
  const linear=[r,g,b].map(channel=>channel<=.04045 ? channel/12.92 : Math.pow((channel+.055)/1.055,2.4))
  const luminance=.2126*linear[0]+.7152*linear[1]+.0722*linear[2]
  return luminance>.43 ? '#172019' : '#F7FAF8'
}

export function TagColorField({ name='color', defaultValue='#D6F0E0' }:Props) {
  const [value,setValue]=useState(normalize(defaultValue))
  const foreground=useMemo(()=>textColor(value),[value])

  return (
    <div className="cms-tag-color-field">
      <label>
        <span>COLOR</span>
        <input
          type="color"
          value={value}
          onChange={event=>setValue(event.target.value.toUpperCase())}
          aria-label="Tag color"
        />
      </label>
      <input
        className="cms-tag-color-hex"
        name={name}
        value={value}
        maxLength={7}
        onChange={event=>setValue(event.target.value.toUpperCase())}
        onBlur={()=>setValue(normalize(value))}
        pattern="^#[0-9A-Fa-f]{6}$"
        required
      />
      <span
        className="cms-tag-color-preview"
        style={{backgroundColor:normalize(value),color:foreground}}
      >
        TAG
      </span>
    </div>
  )
}
