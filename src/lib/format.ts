const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

const parts = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/** "2026/11/09(月) 17:20:01"（日本時間） */
export function formatDateTime(iso: string, withSeconds = true): string {
  const d = new Date(iso)
  const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]))
  const wd = WEEKDAYS[jstWeekday(d)]
  return `${p.year}/${p.month}/${p.day}(${wd}) ${p.hour}:${p.minute}${withSeconds ? `:${p.second}` : ''}`
}

/** 日本時間での曜日（0=日） */
function jstWeekday(d: Date): number {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).getUTCDay()
}

/** "3分前" "2時間前" "11/09" */
export function formatRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'たった今'
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`
  return formatDateTime(iso, false).slice(0, 10)
}
