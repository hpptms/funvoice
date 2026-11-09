import { lazyPage } from './lib/lazyPage'

// よく開かれるページ（トップ・作品・スレッド）は最初のJSに含め、それ以外は開いたときに読み込む
export const AddWorkPage = lazyPage(() => import('./pages/AddWorkPage'))
export const AdminPage = lazyPage(() => import('./pages/AdminPage'))
export const ContactPage = lazyPage(() => import('./pages/ContactPage'))
export const StaticPage = lazyPage(() => import('./pages/StaticPage'))
export const TagsPage = lazyPage(() => import('./pages/TagsPage'))

const LAZY_ROUTES: [RegExp, () => Promise<unknown>][] = [
  [/^\/works\/new\/?$/, AddWorkPage.preload],
  [/^\/admin\/?$/, AdminPage.preload],
  [/^\/contact\/?$/, ContactPage.preload],
  [/^\/(about|terms|privacy|copyright)\/?$/, StaticPage.preload],
  [/^\/tags\/?$/, TagsPage.preload],
]

/** 最初に開かれたページが遅延読み込みのページなら、描画前に読み込んでおく */
export function preloadRoute(pathname: string): Promise<unknown> {
  const hit = LAZY_ROUTES.find(([re]) => re.test(pathname))
  return hit ? hit[1]().catch(() => null) : Promise.resolve(null)
}
