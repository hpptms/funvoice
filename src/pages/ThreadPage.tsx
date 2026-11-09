import EditIcon from '@mui/icons-material/Edit'
import {
  Alert,
  Box,
  Breadcrumbs,
  Card,
  CircularProgress,
  Fab,
  Link,
  Pagination,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import {
  api,
  getAdminToken,
  type MyReactions,
  type Post,
  type PostSort,
  type Reaction,
  type ThreadDetail,
} from '../api/client'
import PostForm, { type PostInput } from '../components/bbs/PostForm'
import PostItem from '../components/bbs/PostItem'
import { Prompt, Window } from '../components/Retro'
import { formatDateTime } from '../lib/format'
import { threadPageDescription, threadPageTitle } from '../../edge/seo'
import { takeInitialData, usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'

type PostPage = { posts: Post[]; total: number; page: number; perPage: number }
type InitialThread = { thread: ThreadDetail; posts: PostPage }

const SORT_LABEL: Record<PostSort, string> = { asc: '番号順', new: '新着順', popular: '人気順' }

export default function ThreadPage() {
  const id = Number(useParams().id)
  const [sp, setSp] = useSearchParams()
  const sort = (['asc', 'new', 'popular'] as const).find((s) => s === sp.get('sort')) ?? 'asc'
  const page = Math.max(1, Number(sp.get('page') ?? 1) || 1)
  const retro = useRetro()
  const qc = useQueryClient()
  const isAdmin = !!getAdminToken()

  // Pages Functions がHTMLに埋め込んだ初期データ（1ページ目・番号順のときだけ使える）
  const [initial] = useState(() =>
    takeInitialData<InitialThread>('fv-initial-thread', (d) => d.thread.id === id),
  )

  const threadQuery = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api.getThread(id),
    enabled: id > 0,
    initialData: initial?.thread,
  })
  const postsKey = ['posts', id, sort, page]
  const postsQuery = useQuery({
    queryKey: postsKey,
    queryFn: () => api.listPosts(id, { sort, page }),
    enabled: id > 0,
    placeholderData: keepPreviousData,
    initialData: sort === 'asc' && page === 1 ? initial?.posts : undefined,
  })
  const myKey = ['my-reactions', id]
  const mineQuery = useQuery({ queryKey: myKey, queryFn: () => api.myReactions(id), enabled: id > 0 })

  const thread = threadQuery.data
  usePageMeta({
    title: thread ? threadPageTitle(thread.title, thread.workTitle) : undefined,
    description: thread ? threadPageDescription(thread) : undefined,
    noindex: sort !== 'asc',
  })

  // ---- 評価 ----
  const [reactingId, setReactingId] = useState<number | null>(null)
  const reactMutation = useMutation({
    mutationFn: ({ post, value }: { post: Post; value: Reaction | null }) => api.react(post.id, value),
    onMutate: ({ post }) => setReactingId(post.id),
    onSuccess: (res, { post }) => {
      const patch = (p: Post) => (p.id === post.id ? { ...p, plus: res.plus, minus: res.minus } : p)
      qc.setQueriesData<PostPage>({ queryKey: ['posts', id] }, (old) => old && { ...old, posts: old.posts.map(patch) })
      qc.setQueryData<MyReactions>(myKey, (old) => {
        const reactions = { ...(old?.reactions ?? {}) }
        if (res.myReaction) reactions[post.id] = res.myReaction
        else delete reactions[post.id]
        return { reactions, mine: old?.mine ?? [] }
      })
    },
    onSettled: () => setReactingId(null),
  })

  // ---- 投稿 ----
  const [body, setBody] = useState('')
  const [toast, setToast] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const postMutation = useMutation({
    mutationFn: (input: PostInput) => api.createPost(id, input),
    onSuccess: ({ post }) => {
      setBody('')
      qc.setQueryData<MyReactions>(myKey, (old) => ({ reactions: old?.reactions ?? {}, mine: [...(old?.mine ?? []), post.id] }))
      qc.setQueryData<ThreadDetail>(['thread', id], (old) => old && { ...old, postCount: post.no })
      // 自分のコメントが載っているページ（番号順の最終ページ）へ移動して表示する。
      // APIはCloudflareで数秒キャッシュされるので、取得し直さず手元のデータに追加する
      const perPage = postsQuery.data?.perPage ?? 100
      const lastPage = Math.ceil(post.no / perPage)
      const key = ['posts', id, 'asc', lastPage]
      qc.setQueryData<PostPage>(key, (old) =>
        old
          ? { ...old, total: Math.max(old.total, post.no), posts: [...old.posts.filter((p) => p.id !== post.id), post] }
          : { posts: [post], total: post.no, page: lastPage, perPage },
      )
      setSp(lastPage > 1 ? { page: String(lastPage) } : {})
      setTimeout(() => document.getElementById(`p${post.no}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
      setToast(`${post.no}番にコメントしました`)
    },
  })

  const reply = (no: number) => {
    setBody((b) => `${b}${b && !b.endsWith('\n') ? '\n' : ''}>>${no}\n`)
    document.getElementById('post-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 300)
  }

  const deleteMutation = useMutation({
    mutationFn: (post: Post) => api.admin.deletePost(post.id),
    onSuccess: (_, post) => {
      qc.setQueriesData<PostPage>({ queryKey: ['posts', id] }, (old) =>
        old && { ...old, posts: old.posts.map((p) => (p.id === post.id ? { ...p, deleted: true, body: '', name: '', anonId: '' } : p)) },
      )
      setToast(`${post.no}番を削除しました`)
    },
  })

  // ページ・並び替えを変えたら先頭へ（#p12 のようなリンクで来た場合はそのコメントへ）
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [postsQuery.data?.page])

  if (threadQuery.isLoading)
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  if (threadQuery.isError) return <Alert severity="error">{(threadQuery.error as Error).message}</Alert>
  if (!thread) return null

  const data = postsQuery.data
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1
  const mine = new Set(mineQuery.data?.mine ?? [])
  const reactions = mineQuery.data?.reactions ?? {}

  const changeSort = (s: PostSort) => setSp(s === 'asc' ? {} : { sort: s })
  const changePage = (p: number) => {
    const next = new URLSearchParams(sp)
    if (p > 1) next.set('page', String(p))
    else next.delete('page')
    setSp(next)
    window.scrollTo({ top: 0 })
  }
  const pagination = pageCount > 1 && (
    <Pagination
      count={pageCount}
      page={page}
      onChange={(_, p) => changePage(p)}
      siblingCount={0}
      sx={{ alignSelf: 'center', my: 1 }}
    />
  )

  return (
    <Stack spacing={2.5}>
      <Box>
        <Breadcrumbs sx={{ fontSize: 13, mb: 1 }} aria-label="パンくずリスト">
          <Link component={RouterLink} to="/" color="inherit">
            {retro ? '~' : 'トップ'}
          </Link>
          <Link component={RouterLink} to={`/works/${thread.workId}`} color="inherit">
            {thread.workTitle}
          </Link>
          <Typography sx={{ fontSize: 13 }} color="text.secondary">
            掲示板
          </Typography>
        </Breadcrumbs>
        <Prompt>less ./bbs/{thread.id}</Prompt>
        <Typography variant="h5" component="h1" sx={{ fontSize: { xs: 21, md: 26 }, lineHeight: 1.45 }}>
          {thread.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {thread.postCount}コメント・{formatDateTime(thread.createdAt, false)} 作成
        </Typography>
      </Box>

      <Card sx={{ overflow: 'visible' }}>
        <Tabs
          value={sort}
          onChange={(_, v: PostSort) => changeSort(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 44, '& .MuiTab-root': { minHeight: 44 } }}
        >
          {(Object.keys(SORT_LABEL) as PostSort[]).map((s) => (
            <Tab key={s} value={s} label={SORT_LABEL[s]} />
          ))}
        </Tabs>
        {pagination}
        {postsQuery.isLoading && <CircularProgress size={24} sx={{ m: 3 }} />}
        {postsQuery.isError && <Alert severity="error">{(postsQuery.error as Error).message}</Alert>}
        <Box sx={{ opacity: postsQuery.isPlaceholderData ? 0.6 : 1 }}>
          {data?.posts.map((p) => (
            <PostItem
              key={p.id}
              threadId={id}
              post={p}
              myReaction={reactions[p.id] ?? null}
              isOwnPost={mine.has(p.id)}
              reacting={reactingId === p.id}
              onReact={(post, value) => reactMutation.mutate({ post, value })}
              onReply={thread.closed ? undefined : reply}
              onReported={() => setToast('通報しました。ご協力ありがとうございます')}
              onAdminDelete={
                isAdmin
                  ? (post) => {
                      if (confirm(`${post.no}番のコメントを削除しますか？`)) deleteMutation.mutate(post)
                    }
                  : undefined
              }
            />
          ))}
        </Box>
        {reactMutation.isError && (
          <Alert severity="warning" sx={{ m: 1 }} onClose={() => reactMutation.reset()}>
            {(reactMutation.error as Error).message}
          </Alert>
        )}
        {pagination}
      </Card>

      <Window file="post.sh" title="コメントを書く">
        <PostForm
          body={body}
          onBodyChange={setBody}
          onSubmit={(input) => postMutation.mutateAsync(input)}
          disabled={thread.closed}
          disabledReason={`このトピックはコメント数が上限（${thread.maxPosts}件）に達したため、書き込めません。`}
          textareaRef={textareaRef}
        />
      </Window>

      {/* スマホ・タブレットでは、どこからでもフォームへ飛べるボタンを右下に出す */}
      {!thread.closed && (
        <Fab
          color="primary"
          variant="extended"
          aria-label="コメントする"
          onClick={() => {
            document.getElementById('post-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 300)
          }}
          sx={{ position: 'fixed', right: 16, bottom: 16, display: { md: 'none' }, borderRadius: retro ? 0 : undefined }}
        >
          <EditIcon sx={{ mr: 0.5 }} />
          コメント
        </Fab>
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Stack>
  )
}
