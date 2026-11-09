// 検索結果に出るタイトル・説明文。
// React の画面（src/lib/pageMeta.ts）と、検索エンジン向けのHTML（functions/）の両方から使い、文言をそろえる。
//
// 狙うキーワード: アニメ / 掲示板 / 応援 / みんなの評価 / 語りたい（とその組み合わせ）。
// 詰め込みすぎると逆効果なので、人が読んで自然な文になる範囲で入れる。

export const SITE_NAME = 'FanVoice'
export const DEFAULT_TITLE = `${SITE_NAME} - アニメを語りたい人の掲示板｜続編を応援・みんなの評価`
export const DEFAULT_DESCRIPTION =
  '好きなアニメを語りたい人のためのアニメ掲示板。1クールで終わった作品に「続編希望」か「キレイに終わった」かを投票して、みんなの評価をチェック。続編を応援する声を数字にして制作者に届けます。'

/** トップの見出し（h1） */
export const TOP_HEADING = 'アニメの続編、見たい？ それとも、キレイに終わった？'
/** トップの見出し下の説明 */
export const TOP_LEAD =
  'アニメを語りたい人の掲示板。1クールで終わった作品へのあなたの1票が、続編を応援する「需要」のデータになり、みんなの評価として制作者に届きます。'

export function pageTitle(title?: string): string {
  return title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
}

export function workPageTitle(title: string): string {
  return `${title}｜続編を応援・みんなの評価と掲示板`
}

const MEDIA_LABEL: Record<string, string> = { tv: 'TVアニメ', web: 'Webアニメ', ova: 'OVA', movie: 'アニメ映画', other: 'アニメ' }

export function mediaLabel(media: string): string {
  return MEDIA_LABEL[media] ?? 'アニメ'
}

/** 作品ページの説明文に必要な項目（API の Work 型の一部） */
export interface WorkForSeo {
  title: string
  media: string
  tags: { name: string; kind: string }[]
  tally: { total: { sequel: number; complete: number } }
}

export function workPageDescription(w: WorkForSeo): string {
  const season = w.tags.find((t) => t.kind === 'season')?.name
  const { sequel, complete } = w.tally.total
  return (
    `${season ? season + 'の' : ''}${mediaLabel(w.media)}「${w.title}」を語りたい人の掲示板。` +
    `続編希望${sequel}票・キレイに終わった${complete}票、みんなの評価を集計中。あなたの1票で続編を応援しよう。`
  )
}

/** 本文を1行の説明文にする（改行・連続空白をまとめて max 文字で切る） */
export function summarize(text: string, max: number): string {
  const s = text.replace(/\s+/g, ' ').trim()
  return [...s].length > max ? [...s].slice(0, max - 1).join('') + '…' : s
}

export function threadPageTitle(threadTitle: string, workTitle: string): string {
  return `${threadTitle}｜${workTitle}の掲示板`
}

export function threadPageDescription(t: { title: string; workTitle: string; postCount: number; excerpt: string }): string {
  return summarize(`「${t.workTitle}」を語りたい人の掲示板「${t.title}」${t.postCount}コメント。${t.excerpt}`, 120)
}

export function tagPageTitle(tagName: string): string {
  return `${tagName}のアニメ一覧｜みんなの評価・掲示板`
}

export function tagPageDescription(tagName: string, total?: number): string {
  return `「${tagName}」タグのアニメ${total ?? ''}作品。続編希望かキレイに終わったか、みんなの評価を一覧で。気になる作品の掲示板で語り合おう。`
}

export const TAGS_PAGE_TITLE = 'タグからアニメを探す'
export const TAGS_PAGE_DESCRIPTION =
  '放送時期・原作/掲載誌・ジャンルのタグからアニメを探そう。みんなの評価を見て、語りたい作品の掲示板へ。続編を応援する1票も。'
