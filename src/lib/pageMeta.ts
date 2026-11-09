import { useEffect } from 'react'
import { DEFAULT_DESCRIPTION, pageTitle } from '../../edge/seo'
import type { Work } from '../api/client'

export { DEFAULT_DESCRIPTION, SITE_NAME } from '../../edge/seo'

function setMeta(name: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (content === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

/**
 * SPA内で画面遷移したときのタイトル・説明文を更新する。
 * 初回表示（検索エンジン・SNS向け）のmetaは Cloudflare Pages Functions がHTMLに埋め込む（functions/ 参照）。
 */
export function usePageMeta({ title, description, noindex }: { title?: string; description?: string; noindex?: boolean }) {
  useEffect(() => {
    document.title = pageTitle(title)
    setMeta('description', description ?? DEFAULT_DESCRIPTION)
    setMeta('robots', noindex ? 'noindex, nofollow' : null)
  }, [title, description, noindex])
}

/**
 * Pages Functions がHTMLに埋め込んだ初期データを読む（APIへの二重リクエストを避ける）。
 * 1回読んだら消して、別のページで使い回さないようにする。
 */
export function takeInitialData<T>(elementId: string, accept: (data: T) => boolean): T | undefined {
  const el = document.getElementById(elementId)
  if (!el) return undefined
  try {
    const data = JSON.parse(el.textContent ?? '') as T
    el.remove()
    return accept(data) ? data : undefined
  } catch {
    el.remove()
    return undefined
  }
}

export function takeInitialWork(id: number): Work | undefined {
  return takeInitialData<Work>('fv-initial-work', (w) => w.id === id)
}
