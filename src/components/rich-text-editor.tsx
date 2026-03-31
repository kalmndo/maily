'use client'

import { useEditor, EditorContent, Editor, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Underline } from '@tiptap/extension-underline'
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Link2, Palette,
} from 'lucide-react'
import { useState, useCallback } from 'react'
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

  const editor = useEditor({
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
    },
    onUpdate: ({ editor }) => onUpdate(editor.getHTML()),
  })

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return
    editor.chain().focus().setLink({ href: linkUrl }).run()
    setLinkUrl('')
    setShowLinkInput(false)
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
        <div className="relative">
          <ToolbarButton onClick={() => setShowLinkInput(v => !v)} active={editor.isActive('link')} title="Insert link">
            <Link2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          {showLinkInput && (
            <div className="absolute bottom-full left-0 z-10 mb-1 flex items-center gap-1 rounded border bg-popover p-1 shadow-md">
              <input
                autoFocus
                type="url"
                placeholder="https://…"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setLink()}
                className="h-7 w-48 rounded border px-2 text-xs focus:outline-none"
              />
              <button type="button" onClick={setLink} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                Add
              </button>
            </div>
          )}
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Font size */}
        <select
          className="h-6 rounded border bg-background px-1 text-xs focus:outline-none"
          onChange={e => {
            const val = e.target.value
            if (val) {
              editor.chain().focus().setMark('textStyle', { fontSize: val }).run()
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
            <div className="absolute bottom-full left-0 z-10 mb-1 flex flex-wrap gap-1 rounded border bg-popover p-2 shadow-md" style={{ width: 100 }}>
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

      {/* Editor body */}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
      {!editor.getText() && (
        <div className="pointer-events-none absolute px-3 py-2 text-sm text-muted-foreground">
          {placeholder}
        </div>
      )}
    </div>
  )
}
