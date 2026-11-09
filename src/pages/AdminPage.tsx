import { Alert, Box, Button, Card, CardContent, Chip, Link, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { MEDIA_LABEL, TAG_KIND_LABEL, api, getAdminToken, setAdminToken, type TagKind, type Work } from '../api/client'
import AdminMediaEditor from '../components/works/AdminMediaEditor'
import { EditRow } from '../components/works/EditHistory'
import { formatDateTime } from '../lib/format'
import { usePageMeta } from '../lib/pageMeta'
import { safeHttpUrl } from '../lib/text'

/**
 * 仮の管理画面。ADMIN_USERNAME / ADMIN_PASSWORD（または ADMIN_TOKEN）でログインするとタグの作成・削除と、作品詳細ページでのタグ編集ができる。
 * 会員機能ができたら管理者ロールでのログインに置き換える。
 */
export default function AdminPage() {
  usePageMeta({ title: '管理', noindex: true })
  const [token, setToken] = useState(getAdminToken())
  // ID/パスワードでのログインが基本。ADMIN_TOKEN を直接入れる方法も残す
  const [useToken, setUseToken] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [input, setInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [pending, setPending] = useState(false)

  const login = async () => {
    setPending(true)
    try {
      const t = useToken ? input : (await api.admin.login(username, password)).token
      setAdminToken(t)
      await api.admin.check()
      setToken(t)
      setLoginError('')
      setPassword('')
      setInput('')
    } catch (e) {
      setAdminToken('')
      setLoginError((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  if (!token) {
    return (
      <Card variant="outlined" sx={{ maxWidth: 420, mx: 'auto' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            管理者ログイン
          </Typography>
          <Stack spacing={2} component="form" onSubmit={(e) => (e.preventDefault(), login())}>
            {useToken ? (
              <TextField
                type="password"
                label="管理トークン（ADMIN_TOKEN）"
                size="small"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            ) : (
              <>
                <TextField
                  label="ユーザー名"
                  size="small"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                  type="password"
                  label="パスワード"
                  size="small"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </>
            )}
            {loginError && <Alert severity="error">{loginError}</Alert>}
            <Button
              type="submit"
              variant="contained"
              disabled={pending || (useToken ? !input : !username || !password)}
            >
              ログイン
            </Button>
            <Button
              size="small"
              onClick={() => {
                setUseToken(!useToken)
                setLoginError('')
              }}
            >
              {useToken ? 'ユーザー名とパスワードでログイン' : '管理トークンでログイン'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" component="h1">
          管理
        </Typography>
        <Button
          onClick={() => {
            setAdminToken('')
            setToken('')
          }}
        >
          ログアウト
        </Button>
      </Stack>
      <Alert severity="info">作品詳細ページを開くと、タグの付け外しができます。</Alert>
      <WorkMediaManager />
      <PendingWorks />
      <RecentEdits />
      <ContactManager />
      <ReportManager />
      <TagManager />
    </Stack>
  )
}

/**
 * 作品の紹介動画（YouTube）・画像の設定。
 * 検索語が空のときは人気順（Annictの視聴者数順）に並べ、よく見られる作品から設定できるようにする。
 */
function WorkMediaManager() {
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<number | null>(null)
  // queryKey を ['works', …] にして、保存後の invalidateQueries(['works']) で一覧も更新されるようにする
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['works', 'admin-media', { q, page }],
    queryFn: () => api.listWorks({ q, sort: 'popular', page }),
    placeholderData: (prev) => prev,
  })
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          作品の動画・画像
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          作品ページに表示する公式PV（YouTube）か画像を設定します。どちらか1つです。検索しないときは人気順に並びます。
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          component="form"
          onSubmit={(e) => {
            e.preventDefault()
            setQ(input.trim())
            setPage(1)
            setEditing(null)
          }}
          sx={{ mb: 2 }}
        >
          <TextField size="small" label="作品名で検索" value={input} onChange={(e) => setInput(e.target.value)} sx={{ flex: 1 }} />
          <Button type="submit" variant="outlined">
            検索
          </Button>
        </Stack>
        {isError && <Alert severity="error">{(error as Error).message}</Alert>}
        {data && data.works.length === 0 && <Typography color="text.secondary">見つかりませんでした</Typography>}
        <Stack spacing={1} sx={{ opacity: isFetching ? 0.6 : 1 }}>
          {data?.works.map((w) => (
            <Box key={w.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
              <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Link component={RouterLink} to={`/works/${w.id}`} sx={{ wordBreak: 'break-all' }}>
                    {w.title}
                  </Link>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {[MEDIA_LABEL[w.media], w.tags.find((t) => t.kind === 'season')?.name].filter(Boolean).join('・')}
                  </Typography>
                </Box>
                <MediaStatus work={w} />
                <Button size="small" variant={editing === w.id ? 'contained' : 'outlined'} onClick={() => setEditing(editing === w.id ? null : w.id)}>
                  {editing === w.id ? '閉じる' : '編集'}
                </Button>
              </Stack>
              {editing === w.id && (
                <Box sx={{ mt: 1.5, mb: 1 }}>
                  <AdminMediaEditor key={w.id} work={w} />
                </Box>
              )}
            </Box>
          ))}
        </Stack>
        {data && pageCount > 1 && (
          <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center', justifyContent: 'center' }}>
            <Button size="small" disabled={page <= 1} onClick={() => (setPage(page - 1), setEditing(null))}>
              前へ
            </Button>
            <Typography variant="body2">
              {page} / {pageCount}
            </Typography>
            <Button size="small" disabled={page >= pageCount} onClick={() => (setPage(page + 1), setEditing(null))}>
              次へ
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

function MediaStatus({ work }: { work: Work }) {
  if (work.youtubeId) return <Chip size="small" color="error" variant="outlined" label="YouTube" />
  if (work.imageUrl || work.image) return <Chip size="small" color="primary" variant="outlined" label="画像" />
  return <Chip size="small" variant="outlined" label="なし" />
}

/** 利用者が追加して、まだ承認していない作品 */
function PendingWorks() {
  const qc = useQueryClient()
  const { data, isError, error } = useQuery({ queryKey: ['admin-pending-works'], queryFn: api.admin.pendingWorks })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-pending-works'] })
    qc.invalidateQueries({ queryKey: ['works'] })
  }
  const approve = useMutation({ mutationFn: (id: number) => api.admin.updateWork(id, { approved: true }), onSuccess: refresh })
  const del = useMutation({ mutationFn: (id: number) => api.admin.deleteWork(id), onSuccess: refresh })
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          承認待ちの作品{data && `（${data.works.length}件）`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          利用者が追加した作品です。サイト上には表示されていますが、承認するまで検索エンジンには載りません。
        </Typography>
        {isError && <Alert severity="error">{(error as Error).message}</Alert>}
        {data?.works.length === 0 && <Typography color="text.secondary">承認待ちの作品はありません</Typography>}
        <Stack spacing={1}>
          {data?.works.map((w) => (
            <Stack key={w.id} direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { sm: 'center' }, borderTop: 1, borderColor: 'divider', pt: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Link component={RouterLink} to={`/works/${w.id}`}>
                  {w.title}
                </Link>
                <Typography variant="caption" color="text.secondary" component="div">
                  {w.tags.map((t) => `#${t.name}`).join(' ')}
                  {w.officialSiteUrl && `　${w.officialSiteUrl}`}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" disabled={approve.isPending} onClick={() => approve.mutate(w.id)}>
                  承認
                </Button>
                <Button
                  color="error"
                  size="small"
                  disabled={del.isPending}
                  onClick={() => confirm(`「${w.title}」を削除しますか？`) && del.mutate(w.id)}
                >
                  削除
                </Button>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

/** 利用者による最近の編集。荒らしは「この人の編集をまとめて戻す」で一括で元に戻せる */
function RecentEdits() {
  const qc = useQueryClient()
  const { data, isError, error } = useQuery({ queryKey: ['admin-edits'], queryFn: api.admin.listEdits })
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          最近の編集
        </Typography>
        {isError && <Alert severity="error">{(error as Error).message}</Alert>}
        {data?.edits.length === 0 && <Typography color="text.secondary">まだ編集はありません</Typography>}
        {data?.edits.map((e) => (
          <EditRow
            key={e.id}
            edit={e}
            showWork
            onReverted={() => {
              qc.invalidateQueries({ queryKey: ['admin-edits'] })
              qc.invalidateQueries({ queryKey: ['admin-pending-works'] })
              qc.invalidateQueries({ queryKey: ['works'] })
              qc.invalidateQueries({ queryKey: ['tags'] })
            }}
          />
        ))}
      </CardContent>
    </Card>
  )
}

/** お問い合わせ・削除依頼（未対応）。削除依頼が先頭に並ぶ */
function ContactManager() {
  const qc = useQueryClient()
  const { data, isError, error } = useQuery({ queryKey: ['admin-contacts'], queryFn: api.admin.listContacts })
  const resolve = useMutation({
    mutationFn: (id: number) => api.admin.resolveContact(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-contacts'] }),
  })
  const label = { general: '一般', copyright: '著作権・削除依頼', bug: '不具合', other: 'その他' } as const

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          お問い合わせ{data && `（${data.contacts.length}件）`}
        </Typography>
        {isError && <Alert severity="error">{(error as Error).message}</Alert>}
        {data?.contacts.length === 0 && <Typography color="text.secondary">未対応のお問い合わせはありません</Typography>}
        <Stack spacing={2}>
          {data?.contacts.map((c) => (
            <Box key={c.id} sx={{ border: 1, borderColor: c.category === 'copyright' ? 'error.main' : 'divider', p: 1.5 }}>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
                <Chip size="small" color={c.category === 'copyright' ? 'error' : 'default'} label={label[c.category]} />
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(c.createdAt, false)}・{c.name || '（名前なし）'}・{c.email || '（メールなし）'}
                </Typography>
              </Stack>
              {c.targetUrl && (
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere', mb: 1 }}>
                  対象：
                  {safeHttpUrl(c.targetUrl) ? (
                    <Link href={safeHttpUrl(c.targetUrl)!} target="_blank" rel="noopener noreferrer">
                      {c.targetUrl}
                    </Link>
                  ) : (
                    c.targetUrl
                  )}
                </Typography>
              )}
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mb: 1 }}>{c.body}</Typography>
              <Button disabled={resolve.isPending} onClick={() => resolve.mutate(c.id)}>
                対応済みにする
              </Button>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

/** 通報されたコメント（未対応）。削除するか、問題なしとして対応済みにする */
function ReportManager() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['admin-reports'], queryFn: api.admin.listReports })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-reports'] })
  const del = useMutation({ mutationFn: (postId: number) => api.admin.deletePost(postId), onSuccess: refresh })
  const resolve = useMutation({ mutationFn: (postId: number) => api.admin.resolveReports(postId), onSuccess: refresh })

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          通報されたコメント{data && `（${data.reports.length}件）`}
        </Typography>
        {isLoading && <Typography color="text.secondary">読み込み中…</Typography>}
        {isError && <Alert severity="error">{(error as Error).message}</Alert>}
        {data?.reports.length === 0 && <Typography color="text.secondary">未対応の通報はありません</Typography>}
        <Stack spacing={2}>
          {data?.reports.map((r) => (
            <Box key={r.postId} sx={{ border: 1, borderColor: 'divider', p: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                <Link component={RouterLink} to={`/threads/${r.threadId}#p${r.no}`}>
                  {r.threadTitle} / {r.no}番
                </Link>
                {'　'}
                {r.name} ID:{r.anonId}・通報{r.count}件・{formatDateTime(r.firstReportedAt, false)}〜
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', my: 1 }}>
                {r.deleted ? '（削除済み）' : r.body}
              </Typography>
              {r.imageUrl && (
                <Box component="img" src={r.imageUrl} alt={`${r.no}番の画像`} sx={{ maxWidth: '100%', maxHeight: 240, display: 'block', mb: 1 }} />
              )}
              <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
                {r.reasons.map((reason, i) => (
                  <Chip key={i} size="small" label={reason} />
                ))}
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  color="error"
                  variant="contained"
                  disabled={del.isPending || r.deleted}
                  onClick={() => confirm(`${r.no}番のコメントを削除しますか？`) && del.mutate(r.postId)}
                >
                  削除する
                </Button>
                <Button disabled={resolve.isPending} onClick={() => resolve.mutate(r.postId)}>
                  問題なし（対応済みにする）
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

function TagManager() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['tags'], queryFn: api.listTags })
  const [name, setName] = useState('')
  const [kind, setKind] = useState<TagKind>('genre')

  const create = useMutation({
    mutationFn: () => api.admin.createTag(name.trim(), kind),
    onSuccess: () => {
      setName('')
      qc.invalidateQueries({ queryKey: ['tags'] })
    },
  })
  const remove = useMutation({
    mutationFn: (id: number) => api.admin.deleteTag(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] })
      qc.invalidateQueries({ queryKey: ['works'] })
    },
  })

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          タグ
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          component="form"
          onSubmit={(e) => (e.preventDefault(), create.mutate())}
        >
          <TextField select size="small" value={kind} onChange={(e) => setKind(e.target.value as TagKind)} sx={{ minWidth: 160 }}>
            {(Object.keys(TAG_KIND_LABEL) as TagKind[]).map((k) => (
              <MenuItem key={k} value={k}>
                {TAG_KIND_LABEL[k]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            placeholder={kind === 'season' ? '例: 2026年秋' : '例: かっこいい'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button type="submit" variant="contained" disabled={!name.trim() || create.isPending}>
            追加
          </Button>
        </Stack>
        {create.isError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {(create.error as Error).message}
          </Alert>
        )}

        {(Object.keys(TAG_KIND_LABEL) as TagKind[]).map((k) => {
          const list = data?.tags.filter((t) => t.kind === k) ?? []
          if (list.length === 0) return null
          return (
            <Box key={k} sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {TAG_KIND_LABEL[k]}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {list.map((t) => (
                  <Chip
                    key={t.id}
                    label={`${t.name} (${t.workCount ?? 0})`}
                    onDelete={() => {
                      if (confirm(`タグ「${t.name}」を削除しますか？付いている作品からも外れます。`)) remove.mutate(t.id)
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )
        })}
      </CardContent>
    </Card>
  )
}
