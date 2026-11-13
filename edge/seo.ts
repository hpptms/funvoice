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

// ---- 作品ページ ----
// 狙う検索語: 「〇〇 2期」「〇〇 2期 いつ」「〇〇 続編」。TV・Webアニメは「2期」、映画・OVA や
// すでに続編と分かる作品名（第2期・Season 2 など）は「続編」と呼ぶ（バックエンドの api.SequelWord と同じ判定）

const SEQUEL_TITLE_RE =
  /第?[0-9０-９一二三四五六七八九十]+期|season\s*[0-9０-９]|[0-9]+(st|nd|rd|th)\s*season|続|完結編|新章|part\s*[0-9]|第[0-9０-９]+クール/i
const ROMAN_SEQUEL_RE = /Ⅱ|Ⅲ|Ⅳ|(^|[^A-Za-z])(II|III|IV)([^A-Za-z]|$)/

export function sequelWord(title: string, media: string): '2期' | '続編' {
  return (media === 'tv' || media === 'web') && !SEQUEL_TITLE_RE.test(title) && !ROMAN_SEQUEL_RE.test(title) ? '2期' : '続編'
}

/** 作品ページの見出し下に出す問いかけ（例: 2期（続編）、見たい？） */
export function sequelQuestion(title: string, media: string): string {
  return sequelWord(title, media) === '2期' ? '2期（続編）、見たい？ それとも、キレイに終わった？' : '続編、見たい？ それとも、キレイに終わった？'
}

/** 「2期（続編）」または「続編」 */
export function sequelPhrase(title: string, media: string): string {
  return sequelWord(title, media) === '2期' ? '2期（続編）' : '続編'
}

export interface WorkForTitle {
  title: string
  media: string
  tally: { total: { sequel: number; complete: number } }
}

export function workPageTitle(w: WorkForTitle): string {
  const { sequel, complete } = w.tally.total
  const votes = sequel + complete > 0 ? `続編希望${sequel}票・みんなの評価` : 'みんなの評価と掲示板'
  return `${w.title} ${sequelPhrase(w.title, w.media)}希望の声｜${votes}`
}

const MEDIA_LABEL: Record<string, string> = { tv: 'TVアニメ', web: 'Webアニメ', ova: 'OVA', movie: 'アニメ映画', other: 'アニメ' }

export function mediaLabel(media: string): string {
  return MEDIA_LABEL[media] ?? 'アニメ'
}

/** 作品ページの説明文に必要な項目（API の Work 型の一部） */
export interface WorkForSeo extends WorkForTitle {
  tags: { name: string; kind: string }[]
  staff?: { role: string; name: string }[]
  cast?: { character: string; name: string }[]
  sequel?: { announced: boolean }
}

export function workPageDescription(w: WorkForSeo): string {
  const season = w.tags.find((t) => t.kind === 'season')?.name
  const { sequel, complete } = w.tally.total
  const staff = staffSummary(w.staff ?? [])
  const cast = castSummary(w.cast ?? [])
  return summarize(
    `${season ? season + 'の' : ''}${mediaLabel(w.media)}「${w.title}」の${sequelPhrase(w.title, w.media)}、見たい？` +
      `${w.sequel?.announced ? '続編（シリーズの新作）の情報あり。' : ''}続編希望${sequel}票・キレイに終わった${complete}票。${staff ? staff + '。' : ''}${cast ? cast + '。' : ''}` +
      `ファンのみんなの評価と掲示板。あなたの1票で続編を応援しよう。`,
    160,
  )
}

/** 「監督 〇〇、制作 〇〇」（説明文用。監督と制作会社を1人ずつ） */
export function staffSummary(staff: { role: string; name: string }[]): string {
  return (
    [
      ['監督', '監督'],
      ['アニメーション制作', '制作'],
    ] as const
  )
    .map(([role, label]) => {
      const s = staff.find((x) => x.role === role)
      return s ? `${label} ${s.name}` : ''
    })
    .filter(Boolean)
    .join('、')
}

/** 「出演 〇〇、〇〇」（説明文用。主要キャストの声優を2人まで） */
export function castSummary(cast: { character: string; name: string }[], max = 2): string {
  const names = [...new Set(cast.map((c) => c.name))].slice(0, max)
  return names.length ? `出演 ${names.join('、')}` : ''
}

/** API の放送開始日時（日本時間の RFC3339）を「2026年10月2日」にする。形式が違えば空 */
export function broadcastDateLabel(iso: string | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T/.exec(iso ?? '')
  return m ? `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日` : ''
}

/** 構造化データ用の日付（YYYY-MM-DD、日本時間）。形式が違えば空 */
export function broadcastDateIso(iso: string | undefined): string {
  const m = /^(\d{4}-\d{2}-\d{2})T/.exec(iso ?? '')
  return m ? m[1] : ''
}

/** "2004-autumn" から今日までの、おおよその年数（放送開始の季節の初めから数える）。1年未満・不明は null */
export function yearsSinceSeason(seasonName: string, now = new Date()): number | null {
  const m = /^(\d{4})-(winter|spring|summer|autumn)$/.exec(seasonName) ?? /^(\d{4})$/.exec(seasonName)
  if (!m) return null
  const month = { winter: 0, spring: 3, summer: 6, autumn: 9 }[m[2] as 'winter'] ?? 0
  const years = (now.getTime() - Date.UTC(Number(m[1]), month, 1)) / (365.25 * 86400 * 1000)
  return years >= 1 ? Math.floor(years) : null
}

// ---- タグ・放送時期のURL ----
// 放送時期は /season/2026-autumn（年だけは /season/2026）、それ以外のタグは /tags/123。
// 以前の /?tag=123 は Pages Functions が 301 で新しいURLへ転送する

const SEASON_SLUG: Record<string, string> = { 冬: 'winter', 春: 'spring', 夏: 'summer', 秋: 'autumn' }
const SEASON_JA: Record<string, string> = { winter: '冬', spring: '春', summer: '夏', autumn: '秋' }

/** 放送時期タグの名前（2026年秋 / 2026年）→ URL用の名前（2026-autumn / 2026）。それ以外は null */
export function seasonSlug(tagName: string): string | null {
  const m = /^(\d{4})年(冬|春|夏|秋)?$/.exec(tagName)
  if (!m) return null
  return m[2] ? `${m[1]}-${SEASON_SLUG[m[2]]}` : m[1]
}

/** URL用の名前（2026-autumn / 2026）→ 放送時期タグの名前（2026年秋 / 2026年）。不正なら null */
export function seasonLabelFromSlug(slug: string): string | null {
  const m = /^(\d{4})(?:-(winter|spring|summer|autumn))?$/.exec(slug)
  if (!m) return null
  return m[2] ? `${m[1]}年${SEASON_JA[m[2]]}` : `${m[1]}年`
}

export function tagPath(tag: { id: number; name: string; kind: string }): string {
  const slug = tag.kind === 'season' ? seasonSlug(tag.name) : null
  return slug ? `/season/${slug}` : `/tags/${tag.id}`
}

// ---- ランキング ----
// /ranking/sequel（2期が見たいアニメランキング）・/ranking/complete（キレイに終わったアニメランキング）
// /ranking/sequel/2026-autumn など放送時期別。文言はバックエンドの api.RankingTitle と同じ

export type RankingKind = 'sequel' | 'complete'

/** ランキングに入る作品がこれより少ないページは、検索エンジンに載せない（中身の薄いページになるため） */
export const RANKING_MIN_WORKS = 3

export function isRankingKind(v: string | undefined): v is RankingKind {
  return v === 'sequel' || v === 'complete'
}

export function isSeasonName(v: string | undefined): v is string {
  return !!v && /^\d{4}-(winter|spring|summer|autumn)$/.test(v)
}

export function rankingPath(kind: RankingKind, season?: string): string {
  return `/ranking/${kind}${season ? `/${season}` : ''}`
}

export function rankingTitle(kind: RankingKind, season?: string): string {
  const label = season ? `${seasonLabelFromSlug(season)}アニメ ` : ''
  if (kind === 'sequel') return label ? `${label}続編希望ランキング` : '2期が見たいアニメランキング'
  return label ? `${label}キレイに終わったランキング` : 'キレイに終わったアニメランキング'
}

export function rankingDescription(kind: RankingKind, season?: string): string {
  const label = season ? `${seasonLabelFromSlug(season)}アニメ` : 'アニメ'
  return kind === 'sequel'
    ? `${label}で「2期（続編）が見たい」の票が多い作品のランキング。ファンの投票で決まる、続編を待ち望まれている作品は？ あなたの1票で順位が変わります。`
    : `${label}で「キレイに終わった」の票が多い作品のランキング。1クールで完結した名作、続編なしで満足の作品は？ ファンの投票で決まります。`
}

/** 直近 n シーズンの名前（新しい順）。ランキングの時期の切り替え用 */
export function recentSeasonNames(n: number, now = new Date()): string[] {
  const jst = new Date(now.getTime() + 9 * 3600 * 1000)
  let y = jst.getUTCFullYear()
  let q = Math.floor(jst.getUTCMonth() / 3) // 0=冬 … 3=秋
  const names = ['winter', 'spring', 'summer', 'autumn']
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    out.push(`${y}-${names[q]}`)
    if (--q < 0) {
      q = 3
      y--
    }
  }
  return out
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

// ---- SNS共有用の画像 ----

/**
 * SNS共有用の画像のURLは、SNS側のキャッシュを更新させるため ?v=票数 を付けて配信する（edge/lib.ts）。
 * v はバックエンドでは使わないので外し、キャッシュのキーも1つにまとめる（v を変えた大量アクセスでMacに描かせない）。
 * ランキング画像の season だけは残す。
 */
export function normalizeOgQuery(pathAndQuery: string): string {
  if (!pathAndQuery.startsWith('/api/og/')) return pathAndQuery
  const url = new URL(pathAndQuery, 'https://x.invalid')
  const season = url.searchParams.get('season')
  const keep = season && /^\d{4}-(winter|spring|summer|autumn)$/.test(season) && url.pathname.startsWith('/api/og/rankings/')
  return url.pathname + (keep ? `?season=${season}` : '')
}

const SEASONS_BY_QUARTER = ['winter', 'spring', 'summer', 'autumn'] as const

/**
 * 今期の放送時期（works.season_name の形式。例: "2026-autumn"）。
 * 日本時間で 1〜3月=冬 / 4〜6月=春 / 7〜9月=夏 / 10〜12月=秋 として、日付から自動で切り替わる。
 */
export function currentSeasonName(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return `${jst.getUTCFullYear()}-${SEASONS_BY_QUARTER[Math.floor(jst.getUTCMonth() / 3)]}`
}

/** 前期の放送時期（今期のひとつ前。例: 今期が "2026-autumn" なら "2026-summer"、"2027-winter" なら "2026-autumn"） */
export function previousSeasonName(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const q = Math.floor(jst.getUTCMonth() / 3)
  return q === 0 ? `${jst.getUTCFullYear() - 1}-autumn` : `${jst.getUTCFullYear()}-${SEASONS_BY_QUARTER[q - 1]}`
}

// ---- 最終回・続編決定 ----

export const FINALES_TITLE = '今週最終回のアニメ｜2期（続編）見たい？投票受付中'
export const FINALES_DESCRIPTION =
  '今週最終回を迎えたアニメと、まもなく最終回のアニメの一覧。見終わったら「続編希望」か「キレイに終わった」かを投票しよう。最終回直後のファンの声を数字にして届けます。'

export const SEQUELS_TITLE = '続編決定アニメ一覧｜FanVoiceで続編を希望された作品'
export const SEQUELS_DESCRIPTION =
  'FanVoiceで「続編希望」の声が集まっていたアニメの、続編（2期・劇場版など）決定の一覧。発表時点の続編希望の票数とあわせて紹介します。'
/** 実績ページを検索エンジンに載せ、サイト内からリンクする件数 */
export const SEQUELS_MIN_ITEMS = 3

/** 日本時間の「12/24(水) 23:00」。形式が違えば空 */
export function broadcastTimeLabel(iso: string | undefined): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const d = new Date(t + 9 * 3600 * 1000)
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getUTCDay()]
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${wd}) ${hh}:${mm}`
}

/** 最終回から何日たったか（未来なら負）。日本時間の日付で数える */
export function daysSinceJst(iso: string, now = new Date()): number {
  const day = (ms: number) => Math.floor((ms + 9 * 3600 * 1000) / 86400000)
  return day(now.getTime()) - day(Date.parse(iso))
}

/** 作品ページの「続編（2期）はある？」の答え（画面・検索エンジン向けHTML・構造化データで同じ文にする） */
export function sequelAnswer(
  w: { title: string; media: string; tally: { total: { sequel: number; complete: number } } },
  st: { announced: boolean; works: { title: string; seasonName: string }[]; notes: string[] } | undefined,
): string {
  const word = sequelWord(w.title, w.media)
  const { sequel, complete } = w.tally.total
  const voices = `FanVoiceでは続編希望${sequel}票・キレイに終わった${complete}票が集まっています。`
  if (st?.announced) {
    const first = st.works[0]
    const label = first ? seasonLabelFromSlug(first.seasonName) : null
    const what = first ? `「${first.title}」${label ? `（${label}）` : ''}` : ''
    const note = st.notes[0] ? `（${st.notes[0]}）` : ''
    return what
      ? `はい。シリーズの続く作品として${what}があります${note}。${voices}`
      : `はい。続編の発表がありました${note}。${voices}`
  }
  return `現時点で「${w.title}」の${word}（続編）の発表は確認できていません。${voices}あなたの1票で続編を応援しよう。`
}

/** 日時がもう過ぎたか */
export function isPast(iso: string, now = new Date()): boolean {
  return Date.parse(iso) <= now.getTime()
}
