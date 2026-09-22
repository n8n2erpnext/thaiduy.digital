'use client'

import Link from 'next/link'
import { ChangeEvent, useState } from 'react'
import { Editor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapLink from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { CmsSelectionBubble, CmsSlashMenu } from '@/components/control/cms-editor-menus'
import type { PostRow } from '@/content/posts'
import { savePostAction } from '@/app/control/(protected)/content/writing/actions'
import { assetUploadMessage } from '@/lib/asset-errors'

const lowlight = createLowlight(common)

type LocaleKey = 'en' | 'vi'
type MediaAsset = {
  id:string
  fileName:string
  publicUrl:string
  altEn:string | null
  altVi:string | null
  sizeBytes:number
  source?:string | null
  sourceUrl?:string | null
  creditName?:string | null
  creditUrl?:string | null
}

type UnsplashPhoto = {
  id:string
  alt:string
  smallUrl:string
  regularUrl:string
  fullUrl:string
  photographer:string
  photographerUrl:string
  sourceUrl:string
}

type SlashState = { locale:LocaleKey; x:number; y:number } | null
type AvailableTag = { slug:string; name:string; color:string; textColor:string; enabled:boolean }
type Props = { post?: PostRow | null; availableTags?:AvailableTag[] }

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,180)
}
function extensions(placeholder: string) {
  return [
    StarterKit.configure({ link:false, codeBlock:false }),
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage:null,
    }),
    TiptapLink.configure({
      openOnClick:false,
      autolink:true,
      HTMLAttributes:{ target:'_blank', rel:'noopener noreferrer' },
    }),
    Image.configure({ inline:false, allowBase64:false }),
    Placeholder.configure({ placeholder }),
  ]
}

function Toolbar({
  editor,
  onImage,
}: {
  editor:Editor | null
  onImage:() => void
}) {
  if (!editor) return null
  const link = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const href = window.prompt('Link URL',previous ?? 'https://')
    if (href === null) return
    if (!href.trim()) return void editor.chain().focus().unsetLink().run()
    editor.chain().focus().extendMarkRange('link').setLink({ href:href.trim() }).run()
  }
  const button = (
    label:string,
    active:boolean,
    action:() => void,
    title?:string,
  ) => (
    <button
      type="button"
      className={active ? 'is-active' : ''}
      onClick={action}
      title={title ?? label}
    >
      {label}
    </button>
  )

  return (
    <div className="cms-editor-toolbar">
      {button('H2',editor.isActive('heading',{level:2}),() => editor.chain().focus().toggleHeading({level:2}).run())}
      {button('H3',editor.isActive('heading',{level:3}),() => editor.chain().focus().toggleHeading({level:3}).run())}
      {button('B',editor.isActive('bold'),() => editor.chain().focus().toggleBold().run(),'Bold')}
      {button('I',editor.isActive('italic'),() => editor.chain().focus().toggleItalic().run(),'Italic')}
      {button('S',editor.isActive('strike'),() => editor.chain().focus().toggleStrike().run(),'Strike')}
      {button('“”',editor.isActive('blockquote'),() => editor.chain().focus().toggleBlockquote().run(),'Quote')}
      {button('• LIST',editor.isActive('bulletList'),() => editor.chain().focus().toggleBulletList().run())}
      {button('1. LIST',editor.isActive('orderedList'),() => editor.chain().focus().toggleOrderedList().run())}
      {button('LINK',editor.isActive('link'),link)}
      {button('IMAGE',false,onImage)}
      {button('—',false,() => editor.chain().focus().setHorizontalRule().run(),'Divider')}
      <span />
      {button('↶',false,() => editor.chain().focus().undo().run(),'Undo')}
      {button('↷',false,() => editor.chain().focus().redo().run(),'Redo')}
    </div>
  )
}

export function CmsPostEditor({ post, availableTags=[] }: Props) {
  const [locale,setLocale] = useState<LocaleKey>('en')
  const [selectedTags,setSelectedTags] = useState<string[]>(
    (post?.tags ?? []).filter(slug=>availableTags.some(tag=>tag.slug===slug && tag.enabled)),
  )
  const [titleEn,setTitleEn] = useState(post?.titleEn ?? '')
  const [titleVi,setTitleVi] = useState(post?.titleVi ?? '')
  const [slug,setSlug] = useState(post?.slug ?? '')
  const [slugTouched,setSlugTouched] = useState(Boolean(post?.slug))
  const [bodyEn,setBodyEn] = useState(post?.bodyEn ?? '')
  const [bodyVi,setBodyVi] = useState(post?.bodyVi ?? '')
  const [cover,setCover] = useState<MediaAsset | null>(
    post?.coverAssetId && post.coverUrl
      ? {
          id:post.coverAssetId,
          fileName:'cover',
          publicUrl:post.coverUrl,
          altEn:post.coverAltEn ?? null,
          altVi:post.coverAltVi ?? null,
          sizeBytes:0,
          source:post.coverSource ?? null,
          sourceUrl:post.coverSourceUrl ?? null,
          creditName:post.coverCreditName ?? null,
          creditUrl:post.coverCreditUrl ?? null,
        }
      : null,
  )
  const [mediaOpen,setMediaOpen] = useState(false)
  const [mediaMode,setMediaMode] = useState<'insert'|'cover'>('insert')
  const [mediaTab,setMediaTab] = useState<'library'|'unsplash'>('library')
  const [media,setMedia] = useState<MediaAsset[]>([])
  const [mediaLoading,setMediaLoading] = useState(false)
  const [uploading,setUploading] = useState(false)
  const [uploadMessage,setUploadMessage] = useState('')
  const [slash,setSlash] = useState<SlashState>(null)
  const [unsplashQuery,setUnsplashQuery] = useState('')
  const [unsplashPhotos,setUnsplashPhotos] = useState<UnsplashPhoto[]>([])
  const [unsplashLoading,setUnsplashLoading] = useState(false)
  const [unsplashError,setUnsplashError] = useState('')

  const editorEn = useEditor({
    extensions:extensions('Start writing in English…'),
    content:post?.bodyEn ?? '',
    immediatelyRender:false,
    editorProps:{
      handleKeyDown(view,event) {
        if (event.key === 'Escape') {
          setSlash(null)
          return false
        }
        if (event.key !== '/' || view.state.selection.$from.parent.textContent.length > 0) return false
        const coords = view.coordsAtPos(view.state.selection.from)
        setSlash({ locale:'en', x:coords.left, y:coords.bottom + 8 })
        return true
      },
    },
    onUpdate:({ editor }) => setBodyEn(editor.getHTML()),
  })
  const editorVi = useEditor({
    extensions:extensions('Bắt đầu viết bằng tiếng Việt…'),
    content:post?.bodyVi ?? '',
    immediatelyRender:false,
    editorProps:{
      handleKeyDown(view,event) {
        if (event.key === 'Escape') {
          setSlash(null)
          return false
        }
        if (event.key !== '/' || view.state.selection.$from.parent.textContent.length > 0) return false
        const coords = view.coordsAtPos(view.state.selection.from)
        setSlash({ locale:'vi', x:coords.left, y:coords.bottom + 8 })
        return true
      },
    },
    onUpdate:({ editor }) => setBodyVi(editor.getHTML()),
  })
  const activeEditor = locale === 'en' ? editorEn : editorVi

  async function loadMedia(
    mode: 'insert'|'cover',
    tab: 'library'|'unsplash' = 'library',
  ) {
    setMediaMode(mode)
    setMediaTab(tab)
    setMediaOpen(true)
    setSlash(null)
    if (tab === 'unsplash') return

    setMediaLoading(true)
    try {
      const response = await fetch('/api/control/assets',{ cache:'no-store' })
      const payload = await response.json() as { assets?:MediaAsset[] }
      if (response.ok) setMedia(payload.assets ?? [])
    } finally {
      setMediaLoading(false)
    }
  }

  function selectAsset(asset: MediaAsset) {
    if (mediaMode === 'cover') {
      setCover(asset)
    } else if (activeEditor) {
      const alt = locale === 'vi'
        ? asset.altVi ?? asset.altEn ?? ''
        : asset.altEn ?? asset.altVi ?? ''
      const chain = activeEditor.chain().focus().setImage({
        src:asset.publicUrl,
        alt,
        title:asset.fileName,
      })
      if (asset.source === 'unsplash' && asset.creditName && asset.creditUrl) {
        chain.insertContent({
          type:'paragraph',
          content:[
            { type:'text', text:'Photo by ' },
            {
              type:'text',
              text:asset.creditName,
              marks:[{ type:'link', attrs:{ href:asset.creditUrl, target:'_blank', rel:'noopener noreferrer' } }],
            },
            { type:'text', text:' on Unsplash' },
          ],
        })
      }
      chain.run()
    }
    setMediaOpen(false)
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMessage('')
    const form = new FormData()
    form.set('file',file)
    form.set('altEn',titleEn)
    form.set('altVi',titleVi)
    try {
      const response = await fetch('/api/control/assets',{
        method:'POST',
        body:form,
        credentials:'same-origin',
      })
      const payload=await response.json() as {
        asset?:MediaAsset
        error?:string
        provider?:'r2'|'local'
      }
      if (!response.ok) {
        setUploadMessage(assetUploadMessage(payload.error ?? 'asset_upload_failed'))
        return
      }
      if (!payload.asset?.publicUrl) {
        setUploadMessage('Upload verified, but no public media URL was returned.')
        return
      }
      const asset=payload.asset
      setMedia(current=>[asset,...current.filter(item=>item.id!==asset.id)])
      setUploadMessage(`${(payload.provider ?? 'storage').toUpperCase()} READY`)
      selectAsset(asset)
    } catch {
      setUploadMessage('Upload request failed before R2 verification.')
    } finally {
      setUploading(false)
      event.target.value=''
    }
  }

  async function searchUnsplash() {
    const query = unsplashQuery.trim()
    if (!query) return
    setUnsplashLoading(true)
    setUnsplashError('')
    try {
      const response = await fetch('/api/control/unsplash?q=' + encodeURIComponent(query),{
        cache:'no-store',
      })
      const payload = await response.json() as { photos?:UnsplashPhoto[]; error?:string }
      if (!response.ok) {
        setUnsplashError(payload.error ?? 'UNSPLASH SEARCH FAILED')
        setUnsplashPhotos([])
        return
      }
      setUnsplashPhotos(payload.photos ?? [])
    } finally {
      setUnsplashLoading(false)
    }
  }

  async function selectUnsplash(photo: UnsplashPhoto) {
    setUnsplashLoading(true)
    setUnsplashError('')
    try {
      const response = await fetch('/api/control/unsplash',{
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ id:photo.id }),
      })
      const payload = await response.json() as { asset?:MediaAsset; error?:string }
      if (!response.ok || !payload.asset?.publicUrl) {
        setUnsplashError(payload.error ?? 'UNSPLASH SELECT FAILED')
        return
      }
      setMedia(current => [payload.asset!,...current.filter(item => item.id !== payload.asset!.id)])
      selectAsset(payload.asset)
    } finally {
      setUnsplashLoading(false)
    }
  }

  const onTitleEn = (value:string) => {
    setTitleEn(value)
    if (!slugTouched) setSlug(slugify(value))
  }
  const onTitleVi = (value:string) => {
    setTitleVi(value)
    if (!slugTouched && !titleEn) setSlug(slugify(value))
  }

  return (
    <form className="cms-post-editor" action={savePostAction}>
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="bodyEn" value={bodyEn} />
      <input type="hidden" name="bodyVi" value={bodyVi} />
      <input type="hidden" name="coverAssetId" value={cover?.id ?? ''} />

      <header className="cms-post-topbar">
        <div>
          <Link href="/control/content/writing">← WRITING</Link>
          <span>{post ? 'EDIT WRITING' : 'NEW WRITING'}</span>
        </div>
        <div>
          {post?.status === 'published' && (
            <Link href={'/writing/' + post.slug} target="_blank">PREVIEW ↗</Link>
          )}
          <select name="status" defaultValue={post?.status ?? 'draft'}>
            <option value="draft">DRAFT</option>
            <option value="published">PUBLISHED</option>
            <option value="archived">ARCHIVED</option>
          </select>
          <button className="control-primary" type="submit">SAVE</button>
        </div>
      </header>
      <div className="cms-post-workspace">
        <main className="cms-post-canvas">
          <div className="cms-locale-tabs">
            <button type="button" data-active={locale === 'en'} onClick={() => setLocale('en')}>ENGLISH</button>
            <button type="button" data-active={locale === 'vi'} onClick={() => setLocale('vi')}>TIẾNG VIỆT</button>
          </div>

          <section hidden={locale !== 'en'} className="cms-language-panel">
            <textarea
              className="cms-title-input"
              name="titleEn"
              value={titleEn}
              onChange={event => onTitleEn(event.target.value)}
              placeholder="Post title"
              rows={1}
            />
            <textarea
              className="cms-excerpt-input"
              name="excerptEn"
              defaultValue={post?.excerptEn ?? ''}
              placeholder="Short excerpt…"
              rows={2}
            />
            <Toolbar editor={editorEn} onImage={() => void loadMedia('insert')} />
            {editorEn && <CmsSelectionBubble editor={editorEn} />}
            <EditorContent editor={editorEn} className="cms-rich-editor" />
          </section>
          <section hidden={locale !== 'vi'} className="cms-language-panel">
            <textarea
              className="cms-title-input"
              name="titleVi"
              value={titleVi}
              onChange={event => onTitleVi(event.target.value)}
              placeholder="Tiêu đề bài viết"
              rows={1}
            />
            <textarea
              className="cms-excerpt-input"
              name="excerptVi"
              defaultValue={post?.excerptVi ?? ''}
              placeholder="Mô tả ngắn…"
              rows={2}
            />
            <Toolbar editor={editorVi} onImage={() => void loadMedia('insert')} />
            {editorVi && <CmsSelectionBubble editor={editorVi} />}
            <EditorContent editor={editorVi} className="cms-rich-editor" />
          </section>
        </main>

        <aside className="cms-post-settings">
          <div className="cms-setting-block">
            <span>URL</span>
            <label className="cms-slug-field">
              <em>/writing/</em>
              <input
                name="slug"
                value={slug}
                onChange={event => {
                  setSlugTouched(true)
                  setSlug(slugify(event.target.value))
                }}
                placeholder="post-slug"
                required
              />
            </label>
          </div>

          <div className="cms-setting-block cms-writing-publish-settings">
            <span>PRESENTATION</span>
            <label className="cms-highlight-toggle">
              <input name="highlight" type="checkbox" defaultChecked={post?.highlight ?? false} />
              <span>
                <strong>HIGHLIGHT</strong>
                <small>Feature on page 1. Public Writing shows at most 2 highlighted posts.</small>
              </span>
            </label>
            <div className="cms-tags-field">
              <div className="cms-tags-field-head">
                <span>TAGS</span>
                <Link href="/control/content/tags" target="_blank">MANAGE TAGS ↗</Link>
              </div>
              {availableTags.filter(tag=>tag.enabled).length ? (
                <div className="cms-tag-picker">
                  {availableTags.filter(tag=>tag.enabled).map(tag=>{
                    const checked=selectedTags.includes(tag.slug)
                    const capped=selectedTags.length>=8 && !checked
                    return (
                      <label
                        key={tag.slug}
                        className="cms-tag-option"
                        data-selected={checked || undefined}
                        data-disabled={capped || undefined}
                        style={{backgroundColor:checked ? tag.color : undefined,color:checked ? tag.textColor : undefined}}
                      >
                        <input
                          type="checkbox"
                          name="tags"
                          value={tag.slug}
                          checked={checked}
                          disabled={capped}
                          onChange={event=>setSelectedTags(current=>event.target.checked
                            ? [...current,tag.slug].slice(0,8)
                            : current.filter(value=>value!==tag.slug))}
                        />
                        <span>#{tag.name}</span>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <div className="cms-tags-empty">
                  No active tags yet. <Link href="/control/content/tags">Create tags first →</Link>
                </div>
              )}
              <small>{selectedTags.length} / 8 selected · Posts can only use tags created in the Tag Registry.</small>
            </div>
          </div>

          <div className="cms-setting-block">
            <span>FEATURE IMAGE</span>
            {cover ? (
              <div className="cms-cover-preview">
                <img src={cover.publicUrl} alt="" />
                {cover.source === 'unsplash' && cover.creditName && (
                  <small>
                    Photo by{' '}
                    <a href={cover.creditUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                      {cover.creditName}
                    </a>{' '}
                    on Unsplash
                  </small>
                )}
                <div>
                  <button type="button" onClick={() => void loadMedia('cover')}>CHANGE</button>
                  <button type="button" onClick={() => setCover(null)}>REMOVE</button>
                </div>
              </div>
            ) : (
              <button className="cms-media-button" type="button" onClick={() => void loadMedia('cover')}>
                + CHOOSE IMAGE
              </button>
            )}
          </div>

          <details className="cms-setting-block">
            <summary>SEO / META</summary>
            <div className="cms-seo-grid">
              <label><span>SEO TITLE / EN</span><input name="seoTitleEn" defaultValue={post?.seoTitleEn ?? ''} /></label>
              <label><span>SEO DESCRIPTION / EN</span><textarea name="seoDescriptionEn" rows={3} defaultValue={post?.seoDescriptionEn ?? ''} /></label>
              <label><span>SEO TITLE / VI</span><input name="seoTitleVi" defaultValue={post?.seoTitleVi ?? ''} /></label>
              <label><span>SEO DESCRIPTION / VI</span><textarea name="seoDescriptionVi" rows={3} defaultValue={post?.seoDescriptionVi ?? ''} /></label>
            </div>
          </details>

          {post && (
            <div className="cms-post-meta">
              <span>UPDATED</span>
              <strong>{new Date(post.updatedAt).toLocaleString('en-GB')}</strong>
              {post.publishedAt && <>
                <span>PUBLISHED</span>
                <strong>{new Date(post.publishedAt).toLocaleString('en-GB')}</strong>
              </>}
            </div>
          )}
        </aside>
      </div>

      {slash && (slash.locale === 'en' ? editorEn : editorVi) && (
        <CmsSlashMenu
          editor={(slash.locale === 'en' ? editorEn : editorVi)!}
          position={{ x:slash.x, y:slash.y }}
          onClose={() => setSlash(null)}
          onImage={() => void loadMedia('insert','library')}
          onUnsplash={() => void loadMedia('insert','unsplash')}
        />
      )}

      {mediaOpen && (
        <div className="cms-media-modal" role="dialog" aria-modal="true">
          <div className="cms-media-dialog">
            <header>
              <div>
                <span>MEDIA</span>
                <strong>{mediaMode === 'cover' ? 'Choose feature image' : 'Insert image'}</strong>
              </div>
              <button type="button" onClick={() => setMediaOpen(false)}>×</button>
            </header>

            <div className="cms-media-tabs">
              <button
                type="button"
                data-active={mediaTab === 'library'}
                onClick={() => void loadMedia(mediaMode,'library')}
              >
                LIBRARY
              </button>
              <button
                type="button"
                data-active={mediaTab === 'unsplash'}
                onClick={() => {
                  setMediaTab('unsplash')
                  setUnsplashError('')
                }}
              >
                UNSPLASH
              </button>
            </div>

            {mediaTab === 'library' ? (
              <>
                <div className="cms-media-upload">
                  <label>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={upload} disabled={uploading} />
                    <span>{uploading ? 'UPLOADING TO R2…' : '+ UPLOAD IMAGE'}</span>
                  </label>
                  {uploadMessage && <small>{uploadMessage}</small>}
                </div>
                <div className="cms-media-grid">
                  {mediaLoading && <p>Loading media…</p>}
                  {!mediaLoading && media.length === 0 && <p>No images yet. Upload the first one.</p>}
                  {media.map(asset => (
                    <button type="button" key={asset.id} onClick={() => selectAsset(asset)}>
                      <img src={asset.publicUrl} alt={asset.altEn ?? asset.altVi ?? asset.fileName} />
                      <span>{asset.source === 'unsplash' && asset.creditName ? 'Photo · ' + asset.creditName : asset.fileName}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="cms-unsplash-search">
                  <input
                    value={unsplashQuery}
                    onChange={event => setUnsplashQuery(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void searchUnsplash()
                      }
                    }}
                    placeholder="Search Unsplash photos…"
                    autoFocus
                  />
                  <button type="button" onClick={() => void searchUnsplash()} disabled={unsplashLoading}>
                    {unsplashLoading ? 'SEARCHING…' : 'SEARCH'}
                  </button>
                </div>
                {unsplashError && <div className="cms-unsplash-error">{unsplashError}</div>}
                <div className="cms-media-grid cms-unsplash-grid">
                  {!unsplashLoading && !unsplashPhotos.length && !unsplashError && (
                    <p>Search Unsplash and choose a photo. Attribution is preserved automatically.</p>
                  )}
                  {unsplashPhotos.map(photo => (
                    <button type="button" key={photo.id} onClick={() => void selectUnsplash(photo)}>
                      <img src={photo.smallUrl} alt={photo.alt} />
                      <span>{photo.photographer}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <footer>
              {mediaTab === 'library'
                ? <Link href="/control/assets" target="_blank">OPEN FULL MEDIA LIBRARY ↗</Link>
                : <span>PHOTOS PROVIDED BY UNSPLASH</span>}
            </footer>
          </div>
        </div>
      )}
    </form>
  )
}
