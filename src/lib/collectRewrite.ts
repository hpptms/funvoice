// GA4 の計測データの送信先を、広告ブロッカーに止められにくい形に変える。
// GA4 には送信先を自サイトの <base> に変える設定（transport_url）があるが、その場合も
// <base>/g/collect?v=2&tid=G-... という形になり、この形自体がブロックリスト（EasyPrivacy）に載っている。
// そこで送信の直前に URL を <base>/<クエリの base64url> に書き換え、エッジ（functions/k/[d].ts）で元に戻して Google へ転送する。

function toBase64Url(s: string): string {
  let bin = ''
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** GA4 の送信URLなら書き換え後のURL、それ以外は null */
export function rewriteCollectUrl(url: string, base: string): string | null {
  const prefix = `${base}/g/collect?`
  return url.startsWith(prefix) ? `${base}/${toBase64Url(url.slice(prefix.length))}` : null
}

/** fetch・sendBeacon・XHR の送信先のうち、GA4 の送信だけを書き換える（それ以外の通信はそのまま） */
export function installCollectRewrite(base: string) {
  const rewrite = (u: string | URL) => rewriteCollectUrl(String(u), base)

  if (typeof navigator.sendBeacon === 'function') {
    const beacon = navigator.sendBeacon.bind(navigator)
    navigator.sendBeacon = (url, data) => beacon(rewrite(url) ?? url, data)
  }

  const origFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url
    const r = rewrite(url)
    if (!r) return origFetch(input, init)
    return origFetch(input instanceof Request ? new Request(r, input) : r, init)
  }

  const origOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (origOpen as any).call(this, method, rewrite(url) ?? url, ...rest)
  } as typeof XMLHttpRequest.prototype.open
}
