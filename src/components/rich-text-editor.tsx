'use client'

import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Underline } from '@tiptap/extension-underline'
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Link2, Palette, Trash2,
} from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Minimal font-size extension — avoids needing Tiptap Pro
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: { chain: () => any }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: { chain: () => any }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

const FONT_SIZES = [
  { label: 'Small', value: '0.875rem' },
  { label: 'Normal', value: '1rem' },
  { label: 'Large', value: '1.25rem' },
]

const COLORS = [
  '#000000', '#374151', '#DC2626', '#D97706',
  '#16A34A', '#2563EB', '#7C3AED', '#DB2777',
]

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'rounded p-1 transition-colors hover:bg-accent',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      {children}
    </button>
  )
}

interface RichTextEditorProps {
  onUpdate: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ onUpdate, placeholder = 'Write your message…', className }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const savedSelection = useRef<{ from: number; to: number } | null>(null)

  const onUpdateRef = useRef(onUpdate)
  useEffect(() => { onUpdateRef.current = onUpdate })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      FontSize,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
      handleClick: (_view, _pos, event) => {
        if ((event.target as HTMLElement).closest('a')) {
          event.preventDefault()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor }) => onUpdateRef.current(editor.getHTML()),
  })

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return
    const chain = editor.chain().focus()
    if (savedSelection.current) {
      chain.setTextSelection(savedSelection.current)
    }
    chain.setLink({ href: linkUrl }).run()
    setLinkUrl('')
    setShowLinkInput(false)
    savedSelection.current = null
  }, [editor, linkUrl])

  if (!editor) return null

  return (
    <div className={cn('flex flex-col border-t', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1">
        {/* Text style group */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* List group */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Link */}
        <ToolbarButton
          onClick={() => {
            const { from, to } = editor.state.selection
            savedSelection.current = { from, to }
            if (editor.isActive('link')) {
              const href = editor.getAttributes('link').href ?? ''
              setLinkUrl(href)
            }
            setShowLinkInput(v => !v)
          }}
          active={editor.isActive('link')}
          title="Insert link"
        >
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Font size */}
        <select
          className="h-6 rounded border bg-background px-1 text-xs focus:outline-none"
          onChange={e => {
            const val = e.target.value
            if (val) {
              ;(editor.chain().focus() as any).setFontSize(val).run()
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Color picker */}
        <div className="relative">
          <ToolbarButton onClick={() => setShowColorPicker(v => !v)} title="Text color">
            <Palette className="h-3.5 w-3.5" />
          </ToolbarButton>
          {showColorPicker && (
            <div
              className="absolute top-full left-0 z-10 mt-1 flex flex-wrap gap-1 rounded border bg-popover p-2 shadow-md w-[100px]"
              onKeyDown={e => e.key === 'Escape' && setShowColorPicker(false)}
            >
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className="h-5 w-5 rounded-full border border-border/50 transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run()
                    setShowColorPicker(false)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Link input row */}
      {showLinkInput && (
        <div className="flex shrink-0 items-center gap-1 border-b px-2 py-1">
          <input
            autoFocus
            type="url"
            placeholder="https://…"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => (e.key === 'Enter' && setLink()) || (e.key === 'Escape' && setShowLinkInput(false))}
            className="h-7 min-w-0 flex-1 rounded border px-2 text-xs focus:outline-none"
          />
          <button type="button" onClick={setLink} className="shrink-0 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
            {editor.isActive('link') ? 'Update' : 'Add'}
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              title="Remove link"
              onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false) }}
              className="shrink-0 rounded p-1 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Editor body */}
      <div className="relative flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
        {!editor.getText() && (
          <div className="pointer-events-none absolute left-0 top-0 px-3 py-2 text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
