export type TagKind = 'source' | 'genre' | 'season' | 'other'
export type Choice = 'sequel' | 'complete'

export const TAG_KIND_LABEL: Record<TagKind, string> = {
  season: '放送時期',
  source: '原作・掲載誌',
  genre: 'ジャンル',
  other: 'その他',
}

export const CHOICE_LABEL: Record<Choice, string> = {
  sequel: '続編希望',
  complete: 'キレイに終わった',
}

export const MEDIA_LABEL: Record<string, string> = {
  tv: 'TV',
  web: 'Web',
  ova: 'OVA',
  movie: '映画',
  other: 'その他',
}

export interface Tag {
  id: number
  name: string
  kind: TagKind
  workCount?: number
}

export interface ChoiceCount {
  sequel: number
  complete: number
}

export interface Tally {
  registered: ChoiceCount
  anonymous: ChoiceCount
  total: ChoiceCount
}

export interface Work {
  id: number
  title: string
  titleKana: string
  media: string
  seasonName: string
  episodesCount: number
  officialSiteUrl: string
  wikipediaUrl: string
  watchersCount: number
  /** annict = Annictから取り込み / user = 利用者が追加 */
  source: 'annict' | 'user'
  /** 利用者が追加した作品は、管理者が承認するまで検索エンジンに載せない */
  approved: boolean
  /** ロック中は利用者がタグを編集できない */
  locked: boolean
  /** 紹介メディア（任意・どちらか一方）。YouTube は動画IDだけ */
  youtubeId?: string
  /** 外部の画像URL（元のサイトから直接表示） */
  imageUrl?: string
  /** 以前にアップロードされた画像（アップロードは終了。既存データの表示用） */
  image?: { id: string; url: string; fullUrl: string; thumbUrl: string; width: number; height: number }
  tags: Tag[]
  tally: Tally
}

export type Season = 'winter' | 'spring' | 'summer' | 'autumn'
/**
 * 放送時期の指定。年＋季節（2026年秋）／年だけ（2026年。1クールか分からない・通年など）／不明（放送時期不明）
 */
export type SeasonInput = { seasonYear: number; season?: Season } | { season: 'unknown' }
export const SEASON_LABEL: Record<Season, string> = { winter: '冬', spring: '春', summer: '夏', autumn: '秋' }

export interface NewWorkInput {
  title: string
  titleKana: string
  media: string
  seasonYear?: number
  season?: Season | 'unknown'
  episodesCount?: number
  officialSiteUrl: string
  tagIds: number[]
  youtubeUrl?: string
  imageUrl?: string
}

export interface WorkEdit {
  id: number
  workId: number
  workTitle?: string
  action: 'create_work' | 'add_tag' | 'remove_tag'
  tagName: string
  tagKind: TagKind | ''
  newTag: boolean
  editorId: string
  isAdmin: boolean
  reverted: boolean
  createdAt: string
}

export interface MyVote {
  choice: Choice
  registered: boolean
}

export interface WorkList {
  works: Work[]
  total: number
  page: number
  perPage: number
}

export type WorkSort = 'recommended' | 'new' | 'popular' | 'votes' | 'sequel'

// ---- 掲示板 ----

export interface ThreadSummary {
  id: number
  workId: number
  title: string
  postCount: number
  createdAt: string
  lastPostedAt: string
  excerpt: string
}

export interface ThreadDetail extends ThreadSummary {
  workTitle: string
  closed: boolean
  maxPosts: number
}

export interface Post {
  id: number
  no: number
  name: string
  anonId: string
  isOwner: boolean
  body: string
  deleted: boolean
  plus: number
  minus: number
  replyCount: number
  createdAt: string
  /** 表示用URLは必ず変換済み（EXIFなし） */
  image?: { id: string; url: string; fullUrl: string; width: number; height: number }
  /** ログイン中に書かれたコメントなら、そのユーザーのアイコン（外部の画像URL） */
  iconUrl?: string
}

/** 登録ユーザー */
export interface User {
  id: number
  name: string
  /** アイコン（外部の画像URL）。未設定なら空 */
  iconUrl: string
}


export type ContactCategory = 'general' | 'copyright' | 'bug' | 'other'

export interface ContactItem {
  id: number
  category: ContactCategory
  name: string
  email: string
  targetUrl: string
  body: string
  createdAt: string
}

export type ThreadSort = 'active' | 'new' | 'popular'
export type PostSort = 'asc' | 'new' | 'popular'
export type Reaction = 1 | -1

export interface MyReactions {
  /** postId(文字列) → 1 | -1 */
  reactions: Record<string, Reaction>
  /** 自分のコメントのID（評価できない） */
  mine: number[]
}

export interface ReportItem {
  postId: number
  threadId: number
  threadTitle: string
  no: number
  name: string
  anonId: string
  body: string
  deleted: boolean
  imageUrl?: string
  count: number
  reasons: string[]
  firstReportedAt: string
}

export class ApiError extends Error {
  status: number
  /** レスポンス本文（409 の existingId などを読むため） */
  data: Record<string, unknown>
  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.data = data
  }
}

const ADMIN_TOKEN_KEY = 'fv_admin_token'

/** ログインで発行されたセッショントークン（"s1.<期限unix秒>.<署名>"）の期限。それ以外は null */
function sessionExpiry(token: string): number | null {
  const m = /^s1\.(\d+)\./.exec(token)
  return m ? Number(m[1]) * 1000 : null
}

/**
 * 管理者のトークン。
 * - ID/パスワードのログインで発行されたセッション（期限付き・1か月）は localStorage に保存し、ブラウザを閉じても残す
 * - ADMIN_TOKEN そのもの（期限なし）は漏れたときの影響が大きいので sessionStorage（タブを閉じると消える）
 * 期限切れのセッションは読み出し時に消す。
 */
export function getAdminToken(): string {
  try {
    const persisted = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (persisted) {
      const exp = sessionExpiry(persisted)
      if (exp !== null && exp > Date.now()) return persisted
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setAdminToken(token: string) {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    if (!token) return
    if (sessionExpiry(token) !== null) localStorage.setItem(ADMIN_TOKEN_KEY, token)
    else sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  } catch {
    /* ストレージが使えない環境では保存しない */
  }
}

async function request<T>(path: string, init: RequestInit & { admin?: boolean } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (init.admin) headers.set('Authorization', `Bearer ${getAdminToken()}`)
  const res = await fetch(`/api${path}`, { ...init, headers, credentials: 'same-origin' })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  // 管理APIで認証に失敗した（期限切れ・ADMIN_TOKEN の変更など）ら、保存しているトークンを捨てる
  if (init.admin && res.status === 401) setAdminToken('')
  if (!res.ok) throw new ApiError(res.status, data.error ?? `エラーが発生しました (${res.status})`, data)
  return data as T
}

export const api = {
  listWorks(params: { q?: string; tags?: number[]; sort?: WorkSort; page?: number }) {
    const sp = new URLSearchParams()
    if (params.q) sp.set('q', params.q)
    params.tags?.forEach((t) => sp.append('tag', String(t)))
    if (params.sort) sp.set('sort', params.sort)
    if (params.page && params.page > 1) sp.set('page', String(params.page))
    return request<WorkList>(`/works?${sp}`)
  },
  getWork: (id: number) => request<Work>(`/works/${id}`),
  createWork: (input: NewWorkInput) => request<Work>('/works', { method: 'POST', body: JSON.stringify(input) }),
  /** 既存のタグを付ける（tagId）／新しいタグを作って付ける（name + kind）／放送時期タグを付ける（seasonYear + season） */
  addWorkTag: (workId: number, input: { tagId: number } | { name: string; kind: TagKind } | SeasonInput) =>
    request<{ tags: Tag[] }>(`/works/${workId}/tags`, { method: 'POST', body: JSON.stringify(input) }),
  removeWorkTag: (workId: number, tagId: number) =>
    request<{ tags: Tag[] }>(`/works/${workId}/tags/${tagId}`, { method: 'DELETE' }),
  listWorkEdits: (workId: number) => request<{ edits: WorkEdit[] }>(`/works/${workId}/edits`),
  getMyVote: (id: number) => request<{ myVote: MyVote | null }>(`/works/${id}/my-vote`),
  vote: (id: number, choice: Choice) =>
    request<{ tally: Tally; myVote: MyVote | null }>(`/works/${id}/vote`, {
      method: 'PUT',
      body: JSON.stringify({ choice }),
    }),
  unvote: (id: number) =>
    request<{ tally: Tally; myVote: MyVote | null }>(`/works/${id}/vote`, { method: 'DELETE' }),
  listTags: () => request<{ tags: Tag[] }>('/tags'),

  listThreads: (workId: number, sort: ThreadSort = 'active', page = 1) =>
    request<{ threads: ThreadSummary[]; total: number; page: number; perPage: number }>(
      `/works/${workId}/threads?sort=${sort}&page=${page}`,
    ),
  createThread: (workId: number, input: { title: string; body: string; name: string; imagePublicId?: string }) =>
    request<{ thread: ThreadSummary; post: Post }>(`/works/${workId}/threads`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getThread: (id: number) => request<ThreadDetail>(`/threads/${id}`),
  listPosts: (threadId: number, params: { page?: number; sort?: PostSort; replyTo?: number }) => {
    const sp = new URLSearchParams()
    if (params.replyTo) sp.set('replyTo', String(params.replyTo))
    if (params.sort && params.sort !== 'asc') sp.set('sort', params.sort)
    if (params.page && params.page > 1) sp.set('page', String(params.page))
    return request<{ posts: Post[]; total: number; page: number; perPage: number }>(`/threads/${threadId}/posts?${sp}`)
  },
  getPost: (threadId: number, no: number) => request<Post>(`/threads/${threadId}/posts/${no}`),
  createPost: (threadId: number, input: { body: string; name: string; imagePublicId?: string }) =>
    request<{ post: Post }>(`/threads/${threadId}/posts`, { method: 'POST', body: JSON.stringify(input) }),
  myReactions: (threadId: number) => request<MyReactions>(`/threads/${threadId}/my-reactions`),
  react: (postId: number, value: Reaction | null) =>
    request<{ plus: number; minus: number; myReaction: Reaction | null }>(`/posts/${postId}/reaction`, {
      method: value ? 'PUT' : 'DELETE',
      body: value ? JSON.stringify({ value }) : undefined,
    }),
  reportPost: (postId: number, reason: string) =>
    request<void>(`/posts/${postId}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
  sendContact: (input: { category: ContactCategory; name: string; email: string; targetUrl: string; body: string }) =>
    request<void>('/contact', { method: 'POST', body: JSON.stringify(input) }),

  auth: {
    me: () => request<{ user: User | null }>('/me'),
    register: (input: { username: string; password: string; passwordConfirm: string }) =>
      request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
    login: (username: string, password: string) =>
      request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
    setIcon: (iconUrl: string) => request<{ user: User }>('/me/icon', { method: 'PUT', body: JSON.stringify({ iconUrl }) }),
  },

  admin: {
    login: (username: string, password: string) =>
      request<{ token: string; expiresAt: string }>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    check: () => request<{ ok: boolean }>('/admin/check', { admin: true }),
    createTag: (name: string, kind: TagKind) =>
      request<Tag>('/admin/tags', { method: 'POST', body: JSON.stringify({ name, kind }), admin: true }),
    deleteTag: (id: number) => request<void>(`/admin/tags/${id}`, { method: 'DELETE', admin: true }),
    attachTag: (workId: number, tagId: number) =>
      request<{ tags: Tag[] }>(`/admin/works/${workId}/tags/${tagId}`, { method: 'PUT', admin: true }),
    detachTag: (workId: number, tagId: number) =>
      request<{ tags: Tag[] }>(`/admin/works/${workId}/tags/${tagId}`, { method: 'DELETE', admin: true }),
    listReports: () => request<{ reports: ReportItem[] }>('/admin/reports', { admin: true }),
    resolveReports: (postId: number) =>
      request<void>(`/admin/posts/${postId}/reports/resolve`, { method: 'PUT', admin: true }),
    deletePost: (postId: number) => request<void>(`/admin/posts/${postId}`, { method: 'DELETE', admin: true }),
    deleteThread: (threadId: number) => request<void>(`/admin/threads/${threadId}`, { method: 'DELETE', admin: true }),
    listContacts: () => request<{ contacts: ContactItem[] }>('/admin/contacts', { admin: true }),
    listEdits: () => request<{ edits: WorkEdit[] }>('/admin/edits', { admin: true }),
    revertEdit: (id: number) => request<{ reverted: number }>(`/admin/edits/${id}/revert`, { method: 'POST', body: '{}', admin: true }),
    revertEditor: (id: number) =>
      request<{ reverted: number }>(`/admin/edits/${id}/revert-editor`, { method: 'POST', body: '{}', admin: true }),
    pendingWorks: () => request<{ works: Work[] }>('/admin/works/pending', { admin: true }),
    updateWork: (
      id: number,
      patch: { approved?: boolean; locked?: boolean; removeMedia?: boolean; youtubeUrl?: string; imageUrl?: string },
    ) =>
      request<Work>(`/admin/works/${id}`, { method: 'PATCH', body: JSON.stringify(patch), admin: true }),
    deleteWork: (id: number) => request<void>(`/admin/works/${id}`, { method: 'DELETE', admin: true }),
    resolveContact: (id: number) => request<void>(`/admin/contacts/${id}/resolve`, { method: 'PUT', admin: true }),
  },
}
