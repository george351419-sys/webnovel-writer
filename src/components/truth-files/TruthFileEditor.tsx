import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Save } from 'lucide-react'
import { useTruthFilesStore } from '@/store/truthFiles'
import { useProjectsStore } from '@/store/projects'
import { TRUTH_FILE_INFO } from './TruthFileInfo'
import type { TruthFileType } from '@/types'

interface Props {
  type: TruthFileType
}

function buildExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: {},
      orderedList: {},
      blockquote: {},
    }),
    Placeholder.configure({ placeholder }),
  ]
}

export default function TruthFileEditor({ type }: Props) {
  const { truthFiles, updateTruthFile } = useTruthFilesStore()
  const currentProjectId = useProjectsStore((s) => s.currentProjectId)

  const info = TRUTH_FILE_INFO[type]
  const file = truthFiles.find((f) => f.type === type && f.projectId === currentProjectId)
  const initialContent = file?.content ?? ''

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const editor = useEditor({
    extensions: buildExtensions(`在这里记录${info.label}...`),
    content: initialContent,
  })

  // 当 type 变化时更新编辑器内容
  useEffect(() => {
    if (editor && file?.content !== undefined) {
      const current = editor.getHTML()
      if (current !== file.content) {
        editor.commands.setContent(file.content || '', { emitUpdate: false })
      }
    }
  }, [type, file?.content, editor])

  const handleSave = useCallback(async () => {
    if (!editor || !currentProjectId) return
    setSaveStatus('saving')
    const html = editor.getHTML()
    await updateTruthFile(currentProjectId, type, html)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [editor, currentProjectId, type, updateTruthFile])

  // Cmd+S 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  return (
    <div className="flex-1 flex flex-col bg-ctp-base overflow-hidden">
      <div className="px-6 py-3 border-b border-ctp-surface0 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>{info.icon}</span>
          <div>
            <h2 className="text-sm font-medium text-ctp-text">{info.label}</h2>
            <p className="text-xs text-ctp-subtext0">{info.desc}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text rounded-md transition-colors"
        >
          <Save className="w-3 h-3" />
          <span>{saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存 ✓' : '保存'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <style>{`
          .truth-editor .ProseMirror {
            min-height: 100%;
            max-width: 680px;
            margin: 0 auto;
            padding: 1.5rem;
            color: #cdd6f4;
            font-size: 14px;
            line-height: 1.8;
            outline: none;
          }
          .truth-editor .ProseMirror h1 { color: #cba6f7; font-size: 1.3em; font-weight: 700; margin-bottom: 0.5em; margin-top: 1.5em; }
          .truth-editor .ProseMirror h2 { color: #89b4fa; font-size: 1.1em; font-weight: 600; margin-bottom: 0.4em; margin-top: 1.2em; }
          .truth-editor .ProseMirror h3 { color: #a6e3a1; font-size: 1em; font-weight: 600; margin-bottom: 0.3em; margin-top: 1em; }
          .truth-editor .ProseMirror p { margin-bottom: 0.8em; }
          .truth-editor .ProseMirror ul, .truth-editor .ProseMirror ol { padding-left: 1.5em; margin-bottom: 0.8em; }
          .truth-editor .ProseMirror li { margin-bottom: 0.2em; }
          .truth-editor .ProseMirror blockquote { border-left: 3px solid #45475a; padding-left: 1em; color: #a6adc8; margin: 1em 0; }
          .truth-editor .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: #6c7086;
            pointer-events: none;
            float: left;
            height: 0;
          }
        `}</style>
        <div className="truth-editor h-full">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
