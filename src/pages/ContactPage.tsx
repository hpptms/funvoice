import { Alert, Box, Button, Card, CardContent, Link, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { api, type ContactCategory } from '../api/client'
import { Prompt } from '../components/Retro'
import { usePageMeta } from '../lib/pageMeta'

const CATEGORIES: Record<ContactCategory, string> = {
  general: 'サイトについてのご質問・ご意見',
  copyright: '著作権・削除依頼',
  bug: '不具合の報告',
  other: 'その他',
}

export default function ContactPage() {
  usePageMeta({ title: 'お問い合わせ', description: 'FanVoiceへのお問い合わせ、著作権侵害などの削除依頼はこちらから。' })
  const [sp] = useSearchParams()
  const initialCategory = (Object.keys(CATEGORIES) as ContactCategory[]).find((c) => c === sp.get('category')) ?? 'general'
  const [category, setCategory] = useState<ContactCategory>(initialCategory)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [targetUrl, setTargetUrl] = useState(sp.get('url') ?? '')
  const [body, setBody] = useState('')
  const copyright = category === 'copyright'

  const mutation = useMutation({ mutationFn: () => api.sendContact({ category, name, email, targetUrl, body }) })
  const canSubmit = body.trim() !== '' && (!copyright || (email.trim() !== '' && targetUrl.trim() !== '')) && !mutation.isPending

  if (mutation.isSuccess) {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          送信しました。お問い合わせありがとうございます。
          {copyright && ' 削除依頼は内容を確認のうえ、速やかに対応します。'}
        </Alert>
        <Button component={RouterLink} to="/">
          トップへ戻る
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Prompt>mail admin@fanvoice</Prompt>
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, mb: 2 }}>
        お問い合わせ
      </Typography>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            spacing={2}
            component="form"
            onSubmit={(e) => {
              e.preventDefault()
              if (canSubmit) mutation.mutate()
            }}
          >
            <TextField select label="お問い合わせの種類" value={category} onChange={(e) => setCategory(e.target.value as ContactCategory)}>
              {(Object.keys(CATEGORIES) as ContactCategory[]).map((c) => (
                <MenuItem key={c} value={c}>
                  {CATEGORIES[c]}
                </MenuItem>
              ))}
            </TextField>
            {copyright && (
              <Alert severity="info">
                削除依頼の前に
                <Link component={RouterLink} to="/copyright">
                  著作権について・削除依頼
                </Link>
                をご確認ください。対象のURL、権利者（または代理人）であること、侵害の内容をお知らせください。
              </Alert>
            )}
            <TextField label="お名前（任意）" value={name} onChange={(e) => setName(e.target.value)} slotProps={{ htmlInput: { maxLength: 50 } }} />
            <TextField
              label={copyright ? 'メールアドレス（必須）' : 'メールアドレス（返信が必要な場合）'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={copyright}
              slotProps={{ htmlInput: { maxLength: 254, autoComplete: 'email' } }}
            />
            {copyright && (
              <TextField
                label="対象のページ・コメントのURL（必須）"
                placeholder="https://…/threads/12#p34"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
                slotProps={{ htmlInput: { maxLength: 500 } }}
              />
            )}
            <TextField
              label="内容"
              multiline
              minRows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              helperText={`${[...body].length} / 4000文字`}
            />
            {mutation.isError && <Alert severity="error">{(mutation.error as Error).message}</Alert>}
            <Typography variant="caption" color="text.secondary">
              入力いただいた情報は、
              <Link component={RouterLink} to="/privacy">
                プライバシーポリシー
              </Link>
              に従って、お問い合わせへの対応にのみ使います。
            </Typography>
            <Button type="submit" variant="contained" size="large" disabled={!canSubmit} sx={{ alignSelf: { sm: 'flex-start' }, minWidth: 160, height: 48 }}>
              {mutation.isPending ? '送信中…' : '送信する'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
