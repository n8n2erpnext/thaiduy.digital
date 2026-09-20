'use client'

import { useEffect,useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'

type SlashPosition = { x:number; y:number }

type Props = {
  editor:Editor
  position:SlashPosition
  onClose:() => void
  onImage:() => void
  onUnsplash:() => void
}

function safeUrl(value: string) {
  const trimmed = value.trim()
  if (!/^https?:\/\//i.test(trimmed)) return ''
  return trimmed
}

function insertBookmark(editor: Editor) {
  const value = window.prompt('URL','https://')
  if (!value) return
  const href = safeUrl(value)
  if (!href) return
  editor.chain().focus().insertContent({
    type:'paragraph',
    content:[{
      type:'text',
      text:href,
      marks:[{ type:'link', attrs:{ href, target:'_blank', rel:'noopener noreferrer' } }],
    }],
  }).run()
}
function insertButton(editor: Editor) {
  const label = window.prompt('Button label','Learn more')
  if (!label) return
  const value = window.prompt('Button URL','https://')
  if (!value) return
  const href = safeUrl(value)
  if (!href) return
  editor.chain().focus().insertContent({
    type:'paragraph',
    content:[{
      type:'text',
      text:'[ ' + label.trim() + ' ]',
      marks:[
        { type:'bold' },
        { type:'link', attrs:{ href, target:'_blank', rel:'noopener noreferrer' } },
      ],
    }],
  }).run()
}

function insertYoutube(editor: Editor) {
  const value = window.prompt('YouTube URL','https://www.youtube.com/watch?v=')
  if (!value) return
  const href = safeUrl(value)
  if (!href) return
  editor.chain().focus().insertContent({
    type:'paragraph',
    content:[
      { type:'text', text:'YouTube · ' },
      {
        type:'text',
        text:href,
        marks:[{ type:'link', attrs:{ href, target:'_blank', rel:'noopener noreferrer' } }],
      },
    ],
  }).run()
}

function insertCode(editor: Editor) {
  const raw = window.prompt(
    'Code language: html, css, shell, python, script/javascript, typescript, json, sql',
    'javascript',
  )
  if (raw === null) return
  const aliases:Record<string,string> = {
    html:'xml',htm:'xml',xml:'xml',
    sh:'bash',shell:'bash',bash:'bash',
    js:'javascript',javascript:'javascript',script:'javascript',
    ts:'typescript',typescript:'typescript',
    py:'python',python:'python',
    css:'css',json:'json',sql:'sql',
  }
  const language = aliases[raw.trim().toLowerCase()] ?? null
  editor.chain().focus().setCodeBlock({ language }).run()
}
export function CmsSlashMenu({
  editor,
  position,
  onClose,
  onImage,
  onUnsplash,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeFromPointer = (event:PointerEvent) => {
      const target = event.target
      if (target instanceof Node && menuRef.current?.contains(target)) return
      onClose()
    }
    const closeFromKey = (event:KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key === 'Tab' || event.key === 'Enter') {
        onClose()
        return
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        onClose()
      }
    }
    const closeFromViewport = () => onClose()

    document.addEventListener('pointerdown',closeFromPointer)
    document.addEventListener('keydown',closeFromKey,true)
    window.addEventListener('blur',closeFromViewport)
    window.addEventListener('resize',closeFromViewport)
    return () => {
      document.removeEventListener('pointerdown',closeFromPointer)
      document.removeEventListener('keydown',closeFromKey,true)
      window.removeEventListener('blur',closeFromViewport)
      window.removeEventListener('resize',closeFromViewport)
    }
  },[onClose])

  const run = (action:() => void) => {
    action()
    onClose()
  }

  const items = [
    { group:'PRIMARY', icon:'▧', label:'Image', note:'Upload or media library', run:onImage },
    { group:'PRIMARY', icon:'◫', label:'Unsplash', note:'Search free photography', run:onUnsplash },
    { group:'PRIMARY', icon:'—', label:'Divider', note:'Horizontal rule', run:() => editor.chain().focus().setHorizontalRule().run() },
    { group:'PRIMARY', icon:'▣', label:'Button', note:'Linked call to action', run:() => insertButton(editor) },
    { group:'PRIMARY', icon:'◇', label:'Bookmark', note:'Linked URL', run:() => insertBookmark(editor) },
    { group:'FORMAT', icon:'H', label:'Heading', note:'Section heading', run:() => editor.chain().focus().setHeading({level:2}).run() },
    { group:'FORMAT', icon:'❝', label:'Quote', note:'Block quote', run:() => editor.chain().focus().setBlockquote().run() },
    { group:'FORMAT', icon:'•', label:'Bulleted list', note:'Unordered list', run:() => editor.chain().focus().toggleBulletList().run() },
    { group:'FORMAT', icon:'1.', label:'Numbered list', note:'Ordered list', run:() => editor.chain().focus().toggleOrderedList().run() },
    { group:'FORMAT', icon:'</>', label:'Code', note:'Language-aware code block', run:() => insertCode(editor) },
    { group:'EMBEDS', icon:'▶', label:'YouTube', note:'Insert video link', run:() => insertYoutube(editor) },
  ]
  let group = ''
  return (
    <div
      ref={menuRef}
      className="cms-slash-menu"
      style={{
        left:`min(${position.x}px, calc(100vw - 350px))`,
        top:`min(${position.y}px, calc(100vh - 480px))`,
      }}
      role="menu"
    >
      <div className="cms-slash-menu-head">
        <span>INSERT CARD</span>
        <kbd>ESC</kbd>
      </div>
      <div className="cms-slash-menu-list">
        {items.map(item => {
          const heading = item.group !== group
          group = item.group
          return (
            <div key={item.group + item.label}>
              {heading && <div className="cms-slash-group">{item.group}</div>}
              <button type="button" onClick={() => run(item.run)}>
                <i>{item.icon}</i>
                <span><strong>{item.label}</strong><small>{item.note}</small></span>
              </button>
            </div>
          )
        })}
      </div>
      <footer>Type / on an empty line to reopen</footer>
    </div>
  )
}
export function CmsSelectionBubble({ editor }: { editor:Editor }) {
  const link = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const value = window.prompt('Link URL',previous ?? 'https://')
    if (value === null) return
    if (!value.trim()) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const href = safeUrl(value)
    if (href) editor.chain().focus().extendMarkRange('link').setLink({href}).run()
  }

  return (
    <BubbleMenu editor={editor} options={{ placement:'top' }}>
      <div className="cms-selection-bubble">
        <button type="button" data-active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button type="button" data-active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button type="button" data-active={editor.isActive('heading',{level:2})} onClick={() => editor.chain().focus().toggleHeading({level:2}).run()}>H</button>
        <button type="button" data-active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</button>
        <button type="button" data-active={editor.isActive('link')} onClick={link}>↗</button>
      </div>
    </BubbleMenu>
  )
}
