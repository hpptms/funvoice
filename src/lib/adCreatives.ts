/**
 * アフィリエイト広告の素材。表示のたびにこの中から1つをランダムに選ぶ。
 * 広告主の許諾が下りたら、ここに1件足すだけで表示の候補に入る（pc と sp は同じ広告主のものをそろえる）。
 *
 * 素材は ASP が発行したタグ（a + img + 計測用の 1x1 img）の値をそのまま写す。
 * スクリプトを使うタグは CSP（script-src）で読めないので、画像のタグだけを載せる。
 */
export interface AdBanner {
  /** 遷移先（クリック計測付きのURL） */
  href: string
  /** バナー画像 */
  img: string
  /** 表示の計測用の 1x1 画像 */
  pixel: string
  alt: string
}

export interface AdCreative {
  /** 管理用の名前（表示はしない） */
  name: string
  /** PC: 300x250 */
  pc: AdBanner
  /** スマホ・タブレット: 320x50 */
  sp: AdBanner
}

export const AD_CREATIVES: AdCreative[] = [
  {
    name: 'hulu',
    pc: {
      href: 'https://t.afi-b.com/visit.php?a=G8792C-W326811n&p=c1001812x',
      img: 'https://www.afi-b.com/upload_image/8792-1529482404-3.gif',
      pixel: 'https://t.afi-b.com/lead/G8792C/c1001812x/W326811n',
      alt: 'コナン',
    },
    sp: {
      href: 'https://t.afi-b.com/visit.php?a=G8792C-q298067J&p=c1001812x',
      img: 'https://www.afi-b.com/upload_image/8792-1504659486-3.gif',
      pixel: 'https://t.afi-b.com/lead/G8792C/c1001812x/q298067J',
      alt: 'hulu',
    },
  },
]

export function pickCreative(): AdCreative | undefined {
  if (AD_CREATIVES.length === 0) return undefined
  return AD_CREATIVES[Math.floor(Math.random() * AD_CREATIVES.length)]
}
