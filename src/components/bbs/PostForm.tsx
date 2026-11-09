import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, type Ref } from 'react'
import { loadSavedName, saveName } from '../../lib/bbs'
import { findEmbeds } from '../../lib/embed'
import { useRetro } from '../../lib/styleMode'

export const MAX_BODY = 2000
export const MAX_NAME = 20

export interface PostInput {
  body: string
  name: string
}

/**
 * コメント投稿フォーム。本文は親が持つ（「返信」ボタンで >>12 を差し込むため）。
 * 画像の添付は無く、画像・動画のURLを本文に貼ると、投稿後にプレビューが表示される。
 */
export default function PostForm({
  body,
  onBodyChange,
  onSubmit,
  disabled,
  disabledReason,
  submitLabel = 'コメントする',
  textareaRef,
  extraValid = true,
}: {
  body: string
  onBodyChange: (v: string) => void
  /** 投稿処理。成功で resolve、失敗で reject（エラーメッセージを表示する） */
  onSubmit: (input: PostInput) => Promise<unknown>
  disabled?: boolean
  disabledReason?: string
  submitLabel?: string
  textareaRef?: Ref<HTMLTextAreaElement>
  /** 親側の入力（トピックのタイトルなど）が揃っているか */
  extraValid?: boolean
}) {
  const retro = useRetro()
  const [name, setName] = useState(loadSavedName)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const length = [...body].length
  const tooLong = length > MAX_BODY
  const canSubmit = !disabled && !pending && body.trim() !== '' && !tooLong && extraValid
  const embedCount = findEmbeds(body).length

  const submit = async () => {
    if (!canSubmit) return
    setPending(true)
    setError('')
    try {
      saveName(name.trim())
      await onSubmit({ body, name: name.trim() })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  if (disabled) {
    return <Alert severity="info">{disabledReason ?? 'コメントできません'}</Alert>
  }

  return (
    <Box
      component="form"
      id="post-form"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <Stack spacing={1.5}>
        <TextField
          label="名前（省略すると「匿名」）"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          slotProps={{ htmlInput: { maxLength: MAX_NAME, autoComplete: 'nickname' } }}
          sx={{ maxWidth: { sm: 320 } }}
        />
        <TextField
          label="コメント"
          multiline
          minRows={4}
          maxRows={14}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              void submit()
            }
          }}
          inputRef={textareaRef}
          error={tooLong}
          helperText={
            `${length} / ${MAX_BODY}文字　「>>番号」で返信できます。画像・YouTube・動画のURLを貼ると表示されます` +
            (embedCount > 0 ? `（${embedCount}件）` : '')
          }
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} sx={{ gap: 1.5, alignItems: { sm: 'center' } }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {retro && '// '}
            IDは同じ日・同じトピック内で共通です。個人情報や、アニメのスクリーンショットなど他人の著作物を無断で掲載しているページの画像・動画のURLは貼らないでください。
          </Typography>
          <Button type="submit" variant="contained" size="large" disabled={!canSubmit} sx={{ minWidth: 160, height: 48 }}>
            {pending ? '送信中…' : submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
