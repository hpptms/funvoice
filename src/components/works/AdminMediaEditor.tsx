import { Alert, Button, Stack, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api, type Work } from '../../api/client'
import { isMediaValid, type MediaChoice } from '../../lib/media'
import MediaPicker from './MediaPicker'

/** 作品に今付いている動画・画像を、入力欄の初期値にする */
function currentChoice(work: Work): MediaChoice {
  if (work.youtubeId) return { kind: 'youtube', url: `https://www.youtube.com/watch?v=${work.youtubeId}` }
  if (work.imageUrl) return { kind: 'image', url: work.imageUrl }
  return { kind: 'none' }
}

/**
 * 管理者用: 作品の紹介動画（YouTube）・画像を設定・変更する。
 * 管理画面の「作品の動画・画像」と、作品ページの管理者メニューで使う。
 */
export default function AdminMediaEditor({ work, onSaved }: { work: Work; onSaved?: (w: Work) => void }) {
  const qc = useQueryClient()
  const [choice, setChoice] = useState<MediaChoice>(() => currentChoice(work))
  const save = useMutation({
    mutationFn: () =>
      api.admin.updateWork(work.id, {
        youtubeUrl: choice.kind === 'youtube' ? choice.url.trim() : '',
        imageUrl: choice.kind === 'image' ? choice.url.trim() : '',
      }),
    onSuccess: (w) => {
      qc.setQueryData<Work>(['work', w.id], w)
      qc.invalidateQueries({ queryKey: ['works'] })
      onSaved?.(w)
    },
  })

  const before = currentChoice(work)
  const url = (c: MediaChoice) => (c.kind === 'none' ? '' : c.url.trim())
  const changed = before.kind !== (url(choice) ? choice.kind : 'none') || url(before) !== url(choice)
  // 以前の仕組みでアップロードされた画像。保存すると置き換わる（Cloudinary からも削除される）
  const legacyImage = !!work.image && !work.imageUrl

  return (
    <Stack spacing={1.5}>
      {legacyImage && (
        <Typography variant="body2" color="text.secondary">
          アップロードされた画像が設定されています。保存するとこの画像は削除され、下の内容に置き換わります。
        </Typography>
      )}
      <MediaPicker value={choice} onChange={setChoice} />
      {save.isError && <Alert severity="error">{(save.error as Error).message}</Alert>}
      {save.isSuccess && !changed && <Alert severity="success">保存しました</Alert>}
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          disabled={save.isPending || !isMediaValid(choice) || (!changed && !legacyImage)}
          onClick={() => save.mutate()}
        >
          {url(choice) ? '動画・画像を保存' : '動画・画像を外して保存'}
        </Button>
        {changed && (
          <Button disabled={save.isPending} onClick={() => setChoice(before)}>
            元に戻す
          </Button>
        )}
      </Stack>
    </Stack>
  )
}
