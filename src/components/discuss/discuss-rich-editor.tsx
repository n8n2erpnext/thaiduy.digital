'use client'

import { useMemo,useState } from 'react'
import { Node } from '@tiptap/core'
import TiptapLink from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { EditorContent,useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common,createLowlight } from 'lowlight'
import type { CommunityParticipant } from '@/community/data'

const lowlight=createLowlight(common)

const EMOJI=[
  '😀','😄','😂','😊','😍','🥰','😎','🤔','😅','😢',
  '😭','😡','👍','👎','👏','🙏','🤝','💪','❤️','💚',
  '🔥','✨','🎉','✅','❌','⚠️','💡','🚀','👀','🫡',
  '🐸','☕','💻','📌','🧠','🛠️','📷','🎯','💬','⭐',
]

const MentionNode=Node.create({
  name:'mention',
  group:'inline',
  inline:true,
  atom:true,
  selectable:false,
  addAttributes(){
    return {
      userId:{default:null},
      label:{default:''},
    }
  },
  parseHTML(){
    return [{
      tag:'span[data-mention-user-id]',
      getAttrs:element=>{
        if (!(element instanceof HTMLElement)) return false
        return {
          userId:element.getAttribute('data-mention-user-id'),
          label:element.getAttribute('data-mention-label') ?? element.textContent?.replace(/^@/,'') ?? '',
        }
      },
    }]
  },
  renderHTML({node}){
    return [
      'span',
      {
        class:'discuss-mention',
        'data-mention-user-id':node.attrs.userId,
        'data-mention-label':node.attrs.label,
      },
      '@'+node.attrs.label,
    ]
  },
  renderText({node}){
    return '@'+String(node.attrs.label ?? '')
  },
})

type ChangeValue={
  html:string
  text:string
}

type Props={
  locale:'en'|'vi'
  participants:CommunityParticipant[]
  placeholder:string
  maxLength:number
  resetKey:number
  onChange:(value:ChangeValue)=>void
}

function extensions(placeholder:string){
  return [
    StarterKit.configure({link:false,codeBlock:false}),
    CodeBlockLowlight.configure({lowlight,defaultLanguage:null}),
    TiptapLink.extend({
      inclusive:false,
    }).configure({
      openOnClick:false,
      autolink:false,
      HTMLAttributes:{target:'_blank',rel:'noopener noreferrer'},
    }),
    Placeholder.configure({placeholder}),
    MentionNode,
  ]
}

function ToolbarButton({
  label,active=false,title,onClick,disabled=false,
}:{
  label:string
  active?:boolean
  title?:string
  onClick:()=>void
  disabled?:boolean
}){
  return (
    <button
      type="button"
      className={active?'is-active':''}
      title={title ?? label}
      disabled={disabled}
      onPointerDown={event=>event.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
export function DiscussRichEditor({
  locale,participants,placeholder,maxLength,resetKey,onChange,
}:Props){
  const vi=locale==='vi'
  const [emojiOpen,setEmojiOpen]=useState(false)
  const [mentionOpen,setMentionOpen]=useState(false)
  const [mentionQuery,setMentionQuery]=useState('')

  const editor=useEditor({
    extensions:extensions(placeholder),
    content:'<p></p>',
    immediatelyRender:false,
    shouldRerenderOnTransaction:true,
    editorProps:{
      attributes:{class:'tiptap discuss-tiptap'},
      handleKeyDown(_view,event){
        if (event.key==='Escape') {
          setEmojiOpen(false)
          setMentionOpen(false)
          return false
        }
        if (event.key==='@' && participants.length) {
          setEmojiOpen(false)
          setMentionOpen(true)
          setMentionQuery('')
          return true
        }
        return false
      },
    },
    onUpdate:({editor})=>{
      onChange({
        html:editor.getHTML(),
        text:editor.getText({blockSeparator:'\n'}),
      })
    },
  },[resetKey])

  const filteredParticipants=useMemo(()=>{
    const query=mentionQuery.trim().toLocaleLowerCase(locale==='vi'?'vi-VN':'en-US')
    if (!query) return participants
    return participants.filter(item=>item.name.toLocaleLowerCase(locale==='vi'?'vi-VN':'en-US').includes(query))
  },[mentionQuery,participants,locale])

  if (!editor) return null

  const link=()=>{
    const active=editor.isActive('link')
    const originalSelection=editor.state.selection

    if (originalSelection.empty && !active) return

    if (originalSelection.empty && active) {
      editor.chain().focus().extendMarkRange('link').run()
    }

    const selectionEnd=editor.state.selection.to
    const previous=editor.getAttributes('link').href as string | undefined
    const value=window.prompt(vi?'Địa chỉ liên kết':'Link URL',previous ?? 'https://')
    if (value===null) {
      editor.commands.setTextSelection(selectionEnd)
      return
    }

    const href=value.trim()
    if (!href) {
      editor.chain().focus().unsetLink().setTextSelection(selectionEnd).run()
      editor.view.dispatch(editor.state.tr.setStoredMarks([]))
      return
    }
    if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
      editor.commands.setTextSelection(selectionEnd)
      return
    }

    editor.chain()
      .focus()
      .setLink({href})
      .setTextSelection(selectionEnd)
      .run()

    editor.view.dispatch(editor.state.tr.setStoredMarks([]))
  }

  const insertEmoji=(emoji:string)=>{
    editor.chain().focus().insertContent(emoji).run()
    setEmojiOpen(false)
  }

  const insertMention=(participant:CommunityParticipant)=>{
    editor.chain().focus()
      .insertContent({
        type:'mention',
        attrs:{userId:participant.id,label:participant.name},
      })
      .insertContent(' ')
      .run()
    setMentionOpen(false)
    setMentionQuery('')
  }
  const textLength=editor.getText({blockSeparator:'\n'}).length
  const overLimit=textLength>maxLength

  return (
    <div className="discuss-editor" data-over-limit={overLimit || undefined}>
      <div className="discuss-editor-toolbar">
        <ToolbarButton
          label="P"
          title={vi?'Đoạn văn thường':'Paragraph'}
          active={editor.isActive('paragraph')}
          onClick={()=>editor.chain().focus().setParagraph().run()}
        />
        <ToolbarButton label="H2" active={editor.isActive('heading',{level:2})} onClick={()=>editor.chain().focus().toggleHeading({level:2}).run()} />
        <ToolbarButton label="H3" active={editor.isActive('heading',{level:3})} onClick={()=>editor.chain().focus().toggleHeading({level:3}).run()} />
        <ToolbarButton label="B" title="Bold" active={editor.isActive('bold')} onClick={()=>editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="I" title="Italic" active={editor.isActive('italic')} onClick={()=>editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="S" title="Strike" active={editor.isActive('strike')} onClick={()=>editor.chain().focus().toggleStrike().run()} />
        <ToolbarButton label="❝" title={vi?'Trích dẫn':'Quote'} active={editor.isActive('blockquote')} onClick={()=>editor.chain().focus().toggleBlockquote().run()} />
        <ToolbarButton label="•" title={vi?'Danh sách':'Bullet list'} active={editor.isActive('bulletList')} onClick={()=>editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="1." title={vi?'Danh sách số':'Numbered list'} active={editor.isActive('orderedList')} onClick={()=>editor.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton
          label="↗"
          title={vi?'Liên kết':'Link'}
          active={editor.isActive('link')}
          disabled={editor.state.selection.empty && !editor.isActive('link')}
          onClick={link}
        />
        <ToolbarButton label="</>" title="Code" active={editor.isActive('codeBlock')} onClick={()=>editor.chain().focus().toggleCodeBlock().run()} />
        <ToolbarButton label="—" title={vi?'Đường phân cách':'Divider'} onClick={()=>editor.chain().focus().setHorizontalRule().run()} />
        <span className="discuss-editor-toolbar-gap" />
        <ToolbarButton
          label="☺"
          title="Emoji"
          active={emojiOpen}
          onClick={()=>{
            setMentionOpen(false)
            setEmojiOpen(value=>!value)
          }}
        />
        {participants.length>0 && (
          <ToolbarButton
            label="@"
            title={vi?'Nhắc người trong chủ đề':'Mention topic participant'}
            active={mentionOpen}
            onClick={()=>{
              setEmojiOpen(false)
              setMentionOpen(value=>!value)
              setMentionQuery('')
            }}
          />
        )}
        <ToolbarButton label="↶" title="Undo" onClick={()=>editor.chain().focus().undo().run()} />
        <ToolbarButton label="↷" title="Redo" onClick={()=>editor.chain().focus().redo().run()} />
      </div>

      {emojiOpen && (
        <div className="discuss-emoji-picker" role="dialog" aria-label="Emoji">
          {EMOJI.map(emoji=>(
            <button type="button" key={emoji} onClick={()=>insertEmoji(emoji)}>{emoji}</button>
          ))}
        </div>
      )}
      {mentionOpen && (
        <div className="discuss-mention-picker" role="dialog" aria-label={vi?'Nhắc người':'Mention'}>
          <header>
            <strong>@ {vi?'NGƯỜI TRONG CHỦ ĐỀ':'TOPIC PARTICIPANTS'}</strong>
            <span>{participants.length}</span>
          </header>
          <input
            value={mentionQuery}
            onChange={event=>setMentionQuery(event.target.value)}
            placeholder={vi?'Tìm tên…':'Find a participant…'}
            autoFocus
          />
          <div>
            {filteredParticipants.map(participant=>(
              <button type="button" key={participant.id} onClick={()=>insertMention(participant)}>
                {participant.image
                  ? <img src={participant.image} alt="" />
                  : <i>{participant.name.slice(0,2).toUpperCase()}</i>}
                <span>
                  <strong>{participant.name}</strong>
                  {participant.isAdmin && <small>ADMIN</small>}
                </span>
              </button>
            ))}
            {!filteredParticipants.length && (
              <p>{vi?'Không có người phù hợp trong chủ đề này.':'No matching participant in this topic.'}</p>
            )}
          </div>
        </div>
      )}

      <EditorContent editor={editor} className="discuss-rich-editor" />

      <footer>
        <span>
          {participants.length
            ? (vi?'Gõ @ hoặc bấm @ để nhắc người đã tham gia chủ đề.':'Type @ or use the @ button to mention topic participants.')
            : (vi?'Rich text · Emoji · Link · Quote · Code':'Rich text · Emoji · Link · Quote · Code')}
        </span>
        <strong data-over={overLimit || undefined}>{textLength} / {maxLength}</strong>
      </footer>
    </div>
  )
}
