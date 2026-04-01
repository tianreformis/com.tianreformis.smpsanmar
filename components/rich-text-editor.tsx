'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon,
  Image as ImageIcon, Heading1, Heading2, Heading3, Code
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  const setLink = () => {
    const url = prompt('Masukkan URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = prompt('Masukkan URL gambar:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const toolbarBtn = (active: boolean) => cn(
    'h-8 w-8 p-0',
    active && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
  )

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 border-b p-2 flex flex-wrap gap-1">
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={toolbarBtn(editor.isActive('heading', { level: 1 }))}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={toolbarBtn(editor.isActive('heading', { level: 2 }))}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={toolbarBtn(editor.isActive('heading', { level: 3 }))}>
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-2 border-r">
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={toolbarBtn(editor.isActive('bold'))}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={toolbarBtn(editor.isActive('italic'))}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={toolbarBtn(editor.isActive('underline'))}>
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={toolbarBtn(editor.isActive('strike'))}>
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCode().run()} className={toolbarBtn(editor.isActive('code'))}>
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-2 border-r">
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={toolbarBtn(editor.isActive({ textAlign: 'left' }))}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={toolbarBtn(editor.isActive({ textAlign: 'center' }))}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={toolbarBtn(editor.isActive({ textAlign: 'right' }))}>
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={toolbarBtn(editor.isActive({ textAlign: 'justify' }))}>
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-2 border-r">
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolbarBtn(editor.isActive('bulletList'))}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolbarBtn(editor.isActive('orderedList'))}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={toolbarBtn(editor.isActive('blockquote'))}>
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-2 border-r">
          <Button type="button" variant="ghost" size="sm" onClick={setLink} className={toolbarBtn(editor.isActive('link'))}>
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={addImage} className={toolbarBtn(false)}>
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 pl-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="h-8 w-8 p-0">
            <Undo className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="h-8 w-8 p-0">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditorContent editor={editor} className="min-h-[300px]" />

      <style>{`
        .ProseMirror { padding: 1rem; min-height: 300px; }
        .ProseMirror:focus { outline: none; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 0.5rem; }
        .ProseMirror a { color: hsl(var(--primary)); text-decoration: underline; }
        .ProseMirror blockquote { border-left: 3px solid hsl(var(--primary)); padding-left: 1rem; margin-left: 0; }
        .ProseMirror pre { background: hsl(var(--muted)); padding: 0.75rem 1rem; border-radius: 0.5rem; }
        .ProseMirror code { background: hsl(var(--muted)); padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
        .ProseMirror h3 { font-size: 1.125rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
      `}</style>
    </div>
  )
}
