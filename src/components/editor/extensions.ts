import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'

export function buildExtensions(placeholder = '开始写作...') {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: {},
      orderedList: {},
      blockquote: {},
      horizontalRule: {},
      code: {},
      codeBlock: {},
    }),
    Placeholder.configure({ placeholder }),
    CharacterCount,
  ]
}
