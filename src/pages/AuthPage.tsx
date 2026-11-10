import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, Link as RouterLink, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Prompt } from '../components/Retro'
import { useMe, useSetMe } from '../lib/auth'
import { usePageMeta } from '../lib/pageMeta'

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/

/** ユーザー登録（mode="register"）とログイン（mode="login"） */
export default function AuthPage({ mode }: { mode: 'register' | 'login' }) {
  const register = mode === 'register'
  usePageMeta({ title: register ? 'ユーザー登録' : 'ログイン', noindex: true })
  const me = useMe()
  const setMe = useSetMe()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const mutation = useMutation({
    mutationFn: async () =>
      register
        ? (await api.auth.register({ username, password, passwordConfirm: confirm })).user
        : (await api.auth.login(username, password)).user,
    onSuccess: (user) => {
      setMe(user)
      // 登録したらアイコンを設定できるマイページへ
      navigate('/mypage', { replace: true })
    },
  })

  if (me && !mutation.isPending && !mutation.isSuccess) return <Navigate to="/mypage" replace />

  const nameError = register && username !== '' && !USERNAME_RE.test(username)
  const passError = register && password !== '' && [...password].length < 8
  const confirmError = register && confirm !== '' && confirm !== password
  const canSubmit = register
    ? USERNAME_RE.test(username) && [...password].length >= 8 && confirm === password && !mutation.isPending
    : username !== '' && password !== '' && !mutation.isPending

  return (
    <Box sx={{ maxWidth: 440, mx: 'auto' }}>
      <Prompt>{register ? 'useradd' : 'login'}</Prompt>
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, mb: 2 }}>
        {register ? 'ユーザー登録' : 'ログイン'}
      </Typography>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            spacing={2}
            component="form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              if (canSubmit) mutation.mutate()
            }}
          >
            {register && (
              <Typography variant="body2" color="text.secondary">
                登録すると、掲示板のコメントにアイコンを表示できます（ログイン中に書いたコメントのみ）。メールアドレスは不要です。
              </Typography>
            )}
            <TextField
              label="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              error={nameError}
              helperText={register ? '半角英数字と _ で3〜20文字（他の人と同じ名前は使えません）' : undefined}
              slotProps={{ htmlInput: { maxLength: 20, autoComplete: 'username', autoCapitalize: 'none', spellCheck: false } }}
            />
            <TextField
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passError}
              helperText={register ? '8文字以上' : undefined}
              slotProps={{ htmlInput: { maxLength: 128, autoComplete: register ? 'new-password' : 'current-password' } }}
            />
            {register && (
              <TextField
                label="パスワード（確認）"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={confirmError}
                helperText={confirmError ? 'パスワードが一致しません' : 'もう一度入力してください'}
                slotProps={{ htmlInput: { maxLength: 128, autoComplete: 'new-password' } }}
              />
            )}
            {mutation.isError && <Alert severity="error">{(mutation.error as Error).message}</Alert>}
            {register && (
              <Typography variant="caption" color="text.secondary">
                アカウントは1人1つまでです。登録すると
                <Link component={RouterLink} to="/terms">
                  利用規約
                </Link>
                ・
                <Link component={RouterLink} to="/privacy">
                  プライバシーポリシー
                </Link>
                に同意したものとみなします。
              </Typography>
            )}
            <Button type="submit" variant="contained" size="large" disabled={!canSubmit} sx={{ height: 48 }}>
              {mutation.isPending ? '送信中…' : register ? '登録する' : 'ログイン'}
            </Button>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              {register ? (
                <>
                  登録済みの方は{' '}
                  <Link component={RouterLink} to="/login">
                    ログイン
                  </Link>
                </>
              ) : (
                <>
                  はじめての方は{' '}
                  <Link component={RouterLink} to="/register">
                    ユーザー登録
                  </Link>
                </>
              )}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
