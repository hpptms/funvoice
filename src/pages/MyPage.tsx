import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import UserIcon from '../components/account/UserIcon'
import { Prompt } from '../components/Retro'
import { useMe, useSetMe } from '../lib/auth'
import { usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'

/** サーバー側（externalImageURL）と同じ判定の簡易版。最終的な判定はサーバーが行う */
function looksLikeImageUrl(u: string): boolean {
  try {
    const url = new URL(u)
    if (url.protocol !== 'https:') return false
    if (/\.(png|jpe?g|gif|webp)$/i.test(url.pathname)) return true
    return url.hostname === 'pbs.twimg.com' && url.pathname.startsWith('/media/') && /^(png|jpe?g|webp)$/i.test(url.searchParams.get('format') ?? '')
  } catch {
    return false
  }
}

/** マイページ: アイコンの設定とログアウト */
export default function MyPage() {
  usePageMeta({ title: 'マイページ', noindex: true })
  const retro = useRetro()
  const me = useMe()
  const setMe = useSetMe()
  const navigate = useNavigate()
  // 入力中の値。未編集（null）なら保存済みのアイコンを表示する
  const [draft, setIconUrl] = useState<string | null>(null)

  const save = useMutation({ mutationFn: (url: string) => api.auth.setIcon(url), onSuccess: (r) => {
      setMe(r.user)
      setIconUrl(null)
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

  const iconUrl = draft ?? me.iconUrl
  const trimmed = iconUrl.trim()
  const invalid = trimmed !== '' && !looksLikeImageUrl(trimmed)
  const changed = trimmed !== me.iconUrl

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Prompt>whoami</Prompt>
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, mb: 2 }}>
        マイページ
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 56, height: 56, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              {me.iconUrl ? (
                <UserIcon url={me.iconUrl} size={56} />
              ) : (
                <Box sx={{ width: 56, height: 56, borderRadius: retro ? 0 : '50%', bgcolor: 'action.hover' }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                ユーザー名
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 18, overflowWrap: 'anywhere' }}>{me.name}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" component="h2" sx={{ fontSize: 18, mb: 1 }}>
            アイコン
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            画像のURL（https で始まる .png / .jpg / .gif / .webp）を指定すると、ログイン中に書いた掲示板のコメントで「名前：匿名」の左にアイコンが表示されます。
            ログアウト中に書いたコメントには表示されません。
          </Typography>
          <Stack
            spacing={2}
            component="form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!invalid && changed && !save.isPending) save.mutate(trimmed)
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ width: 40, height: 40, mt: 1, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {!invalid && <UserIcon url={trimmed} size={40} />}
              </Box>
              <TextField
                fullWidth
                label="画像のURL"
                placeholder="https://example.com/icon.png"
                value={iconUrl}
                onChange={(e) => {
                  setIconUrl(e.target.value)
                  save.reset()
                }}
                error={invalid}
                helperText={invalid ? 'https で始まる画像のURL（.png / .jpg / .gif / .webp）を指定してください' : '空にして保存するとアイコンを外します'}
                slotProps={{ htmlInput: { maxLength: 1000, inputMode: 'url', autoCapitalize: 'none', spellCheck: false } }}
              />
            </Stack>
            {save.isError && <Alert severity="error">{(save.error as Error).message}</Alert>}
            {save.isSuccess && <Alert severity="success">保存しました</Alert>}
            <Button
              type="submit"
              variant="contained"
              disabled={invalid || !changed || save.isPending}
              sx={{ alignSelf: { sm: 'flex-start' }, minWidth: 140, height: 44 }}
            >
              {save.isPending ? '保存中…' : '保存する'}
            </Button>
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
    </Box>
  )
}
