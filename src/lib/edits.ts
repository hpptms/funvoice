import { TAG_KIND_LABEL, type WorkEdit } from '../api/client'

/** 編集履歴の1件を文章にする（例: ジャンルタグ「熱血」を追加） */
export function describeEdit(e: WorkEdit): string {
  const kind = e.tagKind ? `${TAG_KIND_LABEL[e.tagKind]}タグ` : 'タグ'
  switch (e.action) {
    case 'create_work':
      return '作品を追加'
    case 'add_tag':
      return `${kind}「${e.tagName}」を${e.newTag ? '新しく作って' : ''}追加`
    case 'remove_tag':
      return `${kind}「${e.tagName}」を削除`
  }
}
