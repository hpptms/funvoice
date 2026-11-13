import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api, type User } from '../api/client'
import IconPicker from '../components/account/IconPicker'
import SupporterBadge from '../components/account/SupporterBadge'
import SupporterCard from '../components/account/SupporterCard'
import UserIcon from '../components/account/UserIcon'
import MyPosts from '../components/mypage/MyPosts'
import MyPredictions from '../components/mypage/MyPredictions'
import MyVotes from '../components/mypage/MyVotes'
import NotifySettingsCard from '../components/mypage/NotifySettingsCard'
import { Prompt } from '../components/Retro'
import { useMe, useSetMe } from '../lib/auth'
import { hasIconChoice, iconChoiceError, saveIcon, type IconChoice } from '../lib/iconUpload'
import { usePageMeta } from '../lib/pageMeta'
import { predictionBadge } from '../lib/predictions'
import { useRetro } from '../lib/styleMode'

const TABS = [
  ['votes', '投票'],
  ['posts', 'コメント'],
  ['predictions', '予想'],
  ['notify', '通知'],
  ['account', 'アカウント'],
] as const
type TabKey = (typeof TABS)[number][0]

/** 今のアイコンに合わせた入力の初期値（外部URLならそのURLを入れておく） */
const initialChoice = (me: User): IconChoice => (me.iconKind === 'url' ? { kind: 'url', url: me.iconUrl } : { kind: 'file', file: null })

/** マイページ: 投票・コメント・予想の履歴、通知の設定、アカウント（サポーター・アイコン・ログアウト） */
export default function MyPage() {
  usePageMeta({ title: 'マイページ', noindex: true })
  const retro = useRetro()
  const me = useMe()
  const setMe = useSetMe()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const tab: TabKey = TABS.find(([k]) => k === sp.get('tab'))?.[0] ?? 'votes'
  // 予想のバッジ（ヘッダーのカードに出す）
  const stats = useQuery({ queryKey: ['me', 'predictions', 1], queryFn: () => api.me.predictions(1), enabled: !!me })
  const badge = predictionBadge(stats.data?.stats.yesHits ?? 0)
  // 登録画面でアイコンの設定に失敗したときのメッセージ
  const iconErrorOnRegister = (useLocation().state as { iconError?: string } | null)?.iconError
  // 入力中のアイコン。未編集（null）なら今のアイコンに合わせる
  const [draft, setDraft] = useState<IconChoice | null>(null)

  const save = useMutation({
    mutationFn: saveIcon,
    onSuccess: (user) => {
      setMe(user)
      setDraft(null)
    },
  })
  const remove = useMutation({
    mutationFn: async () => (await api.auth.setIcon({ iconUrl: '' })).user,
    onSuccess: (user) => {
      setMe(user)
      setDraft(null)
    },
  })
  const logout = useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      setMe(null)
      navigate('/', { replace: true })
    },
  })

  if (me === undefined) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 6 }} />
  if (me === null) return logout.isPending || logout.isSuccess ? null : <Navigate to="/login" replace />

  const choice = draft ?? initialChoice(me)
  const unchanged = choice.kind === 'url' && me.iconKind === 'url' && choice.url.trim() === me.iconUrl
  const canSave = hasIconChoice(choice) && !iconChoiceError(choice) && !unchanged && !save.isPending
  const busy = save.isPending || remove.isPending

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Prompt>whoami</Prompt>
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, mb: 2 }}>
        マイページ
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 56, height: 56, display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: retro ? 0 : '50%', bgcolor: 'action.hover' }}>
              {me.iconUrl && <UserIcon url={me.iconUrl} size={56} />}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                ユーザー名
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 18, overflowWrap: 'anywhere' }}>{me.name}</Typography>
                {me.premium && <SupporterBadge />}
                {badge && (
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={<EmojiEventsIcon sx={{ color: '#F2B705 !important' }} />}
                    label={badge}
                    onClick={() => setSp({ tab: 'predictions' })}
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onChange={(_, v: TabKey) => setSp(v === 'votes' ? {} : { tab: v }, { replace: true })}
        variant="scrollable"
        scrollButtons={false}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { minWidth: { xs: 60, sm: 100 }, px: { xs: 1, sm: 2 }, minHeight: 48 } }}
      >
        {TABS.map(([k, label]) => (
          <Tab key={k} value={k} label={label} />
        ))}
      </Tabs>

      {tab === 'votes' && <Card sx={{ mb: 2 }}><CardContent sx={{ p: { xs: 2, sm: 3 } }}><MyVotes /></CardContent></Card>}
      {tab === 'posts' && <Card sx={{ mb: 2 }}><CardContent sx={{ p: { xs: 2, sm: 3 } }}><MyPosts /></CardContent></Card>}
      {tab === 'predictions' && <Card sx={{ mb: 2 }}><CardContent sx={{ p: { xs: 2, sm: 3 } }}><MyPredictions /></CardContent></Card>}
      {tab === 'notify' && <Card sx={{ mb: 2 }}><CardContent sx={{ p: { xs: 2, sm: 3 } }}><NotifySettingsCard /></CardContent></Card>}
      {tab === 'account' && (
        <>
        <SupporterCard />

        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" component="h2" sx={{ fontSize: 18, mb: 1 }}>
              アイコン
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ログイン中に書いた掲示板のコメントで「名前：匿名」の左にアイコンが表示されます（ログアウト中に書いたコメントには表示されません）。
              {me.iconKind && `現在: ${me.iconKind === 'upload' ? 'アップロードした画像' : '外部URLの画像'}`}
            </Typography>
            {iconErrorOnRegister && !draft && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                登録は完了しましたが、アイコンを設定できませんでした（{iconErrorOnRegister}）。もう一度設定してください。
              </Alert>
            )}
            <Stack
              spacing={2}
              component="form"
              onSubmit={(e) => {
                e.preventDefault()
                if (canSave) save.mutate(choice)
              }}
            >
              <IconPicker
                value={choice}
                current={me.iconUrl}
                onChange={(c) => {
                  setDraft(c)
                  save.reset()
                  remove.reset()
                }}
              />
              {save.isError && <Alert severity="error">{(save.error as Error).message}</Alert>}
              {remove.isError && <Alert severity="error">{(remove.error as Error).message}</Alert>}
              {(save.isSuccess || remove.isSuccess) && <Alert severity="success">{remove.isSuccess ? 'アイコンを外しました' : '保存しました'}</Alert>}
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button type="submit" variant="contained" disabled={!canSave || busy} sx={{ minWidth: 140, height: 44 }}>
                  {save.isPending ? (choice.kind === 'file' ? 'アップロード中…' : '保存中…') : '保存する'}
                </Button>
                {me.iconKind && (
                  <Button color="inherit" disabled={busy} onClick={() => remove.mutate()} sx={{ height: 44 }}>
                    アイコンを外す
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Button variant="outlined" color="inherit" onClick={() => logout.mutate()} disabled={logout.isPending} sx={{ height: 44, minWidth: 140 }}>
          ログアウト
        </Button>
        {logout.isError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {(logout.error as Error).message}
          </Alert>
        )}
        </>
      )}
    </Box>
  )
}
