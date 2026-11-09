import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import YouTubeIcon from '@mui/icons-material/YouTube'
import { Alert, Box, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useState } from 'react'
import { isImageUrl, type MediaChoice } from '../../lib/media'
import { useRetro } from '../../lib/styleMode'
import { parseYouTubeId, youtubeThumbnail } from '../../lib/youtube'

/**
 * 作品の紹介メディア（YouTube の動画URL か 外部の画像URL）を任意で選ぶ。
 * 画像はアップロードせず、元のサイトから直接表示する。
 */
export default function MediaPicker({ value, onChange }: { value: MediaChoice; onChange: (m: MediaChoice) => void }) {
  const retro = useRetro()
  const youtubeId = value.kind === 'youtube' ? parseYouTubeId(value.url) : null
  const imageUrl = value.kind === 'image' && isImageUrl(value.url) ? value.url.trim() : null

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        PV・画像（任意・どちらか1つ）
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value.kind}
        onChange={(_, v: MediaChoice['kind'] | null) => v && onChange(v === 'none' ? { kind: v } : { kind: v, url: '' })}
        aria-label="添付するメディアの種類"
        sx={{ mb: 1.5, '& .MuiToggleButton-root': { height: 40, px: 2, gap: 0.5 } }}
      >
        <ToggleButton value="none">なし</ToggleButton>
        <ToggleButton value="youtube">
          <YouTubeIcon fontSize="small" /> YouTube
        </ToggleButton>
        <ToggleButton value="image">
          <ImageOutlinedIcon fontSize="small" /> 画像
        </ToggleButton>
      </ToggleButtonGroup>

      {value.kind === 'youtube' && (
        <Stack spacing={1}>
          <TextField
            label="YouTube の動画URL"
            placeholder="https://www.youtube.com/watch?v=…"
            value={value.url}
            onChange={(e) => onChange({ kind: 'youtube', url: e.target.value })}
            error={value.url.trim() !== '' && !youtubeId}
            helperText={
              value.url.trim() !== '' && !youtubeId
                ? 'YouTube の動画のURLを入力してください（チャンネルや再生リストは不可）'
                : '公式のPV・CMなど。ページ上では YouTube の埋め込みで表示されます'
            }
            slotProps={{ htmlInput: { maxLength: 500, inputMode: 'url' } }}
          />
          {youtubeId && (
            <Box
              component="img"
              src={youtubeThumbnail(youtubeId)}
              alt="動画のサムネイル（確認用）"
              sx={{ width: 240, aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: retro ? 0 : 1 }}
            />
          )}
        </Stack>
      )}

      {value.kind === 'image' && (
        <Stack spacing={1}>
          <TextField
            label="画像のURL"
            placeholder="https://example.com/image.jpg"
            value={value.url}
            onChange={(e) => onChange({ kind: 'image', url: e.target.value })}
            error={value.url.trim() !== '' && !imageUrl}
            helperText={
              value.url.trim() !== '' && !imageUrl
                ? 'https:// で始まり、.png / .jpg / .gif / .webp で終わる画像のURLを入力してください'
                : '画像は保存せず、元のサイトから直接表示します'
            }
            slotProps={{ htmlInput: { maxLength: 1000, inputMode: 'url' } }}
          />
          {/* URLが変わったら作り直して、読み込み状態をリセットする */}
          {imageUrl && <ImagePreview key={imageUrl} url={imageUrl} />}
          <Alert severity="warning">
            キービジュアル・アニメのスクリーンショットなどを無断で掲載しているページの画像は使えません。公式サイトの画像を使う場合も、公式が利用を認めているものに限ります。
            公式の映像を紹介したい場合は、YouTube の公式PVを選んでください。
          </Alert>
        </Stack>
      )}
    </Box>
  )
}

/** 入力した画像URLのプレビュー。読み込めない場合は知らせる（投稿はできるが、ページ上でも表示されない） */
function ImagePreview({ url }: { url: string }) {
  const retro = useRetro()
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  return (
    <Box>
      {state !== 'error' && (
        <Box
          component="img"
          src={url}
          alt="画像のプレビュー（確認用）"
          referrerPolicy="no-referrer"
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
          sx={{ display: 'block', maxWidth: 240, maxHeight: 180, objectFit: 'contain', bgcolor: 'action.hover', borderRadius: retro ? 0 : 1 }}
        />
      )}
      {state === 'error' && (
        <Alert severity="error">この画像を読み込めませんでした。URLが正しいか、画像が公開されているかを確認してください。</Alert>
      )}
    </Box>
  )
}
