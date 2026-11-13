// FanVoice の Service Worker。プッシュ通知（返信・続編決定）を表示するだけで、ページのキャッシュはしない。
// 通知をオンにしたときだけ登録される（src/lib/push.ts）。

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

/** サイト内のパスだけを開く（通知の内容に別のサイトのURLが入っていても開かない） */
function sameOriginUrl(path) {
  try {
    const url = new URL(path || '/', self.location.origin)
    return url.origin === self.location.origin ? url.href : self.location.origin + '/'
  } catch {
    return self.location.origin + '/'
  }
}

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = typeof data.title === 'string' && data.title ? data.title.slice(0, 80) : 'FanVoice'
  const body = typeof data.body === 'string' ? data.body.slice(0, 200) : ''
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      tag: typeof data.tag === 'string' ? data.tag.slice(0, 64) : undefined,
      data: { url: sameOriginUrl(data.url) },
      lang: 'ja',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || self.location.origin + '/'
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin && 'navigate' in w) {
          await w.focus()
          return w.navigate(url)
        }
      }
      return self.clients.openWindow(url)
    })(),
  )
})
