import { useEditor, EditorContent } from '@tiptap/react'
import { buildExtensions } from './extensions'
import './editor.css'

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  editable?: boolean
}

export default function Editor({ content, onChange, placeholder, editable = true }: Props) {
  const editor = useEditor({
    extensions: buildExtensions(placeholder),
    content,
    editable,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
  })

  return (
    <div className="tiptap-editor flex-1 overflow-y-auto">
      <EditorContent editor={editor} />
    </div>
  )
}
