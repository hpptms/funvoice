import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import LinkIcon from '@mui/icons-material/Link'
import { Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useEffect, useMemo, useRef } from 'react'
import { ICON_ACCEPT, iconChoiceError, type IconChoice } from '../../lib/iconUpload'
import { isImageUrl } from '../../lib/media'
import { useRetro } from '../../lib/styleMode'
import UserIcon from './UserIcon'

/**
 * アイコンの指定。「画像を選択」（Cloudinary に保存）か「外部URL」（元のサイトから直接表示）を切り替える。
 * 選んだ画像・URLはその場でプレビューする。
 */
export default function IconPicker({ value, onChange, current }: { value: IconChoice; onChange: (c: IconChoice) => void; current?: string }) {
  const retro = useRetro()
  const fileInput = useRef<HTMLInputElement>(null)
  const error = iconChoiceError(value)

  // 選んだファイルのプレビュー（blob: URL。使い終わったら解放する）
  const file = value.kind === 'file' ? value.file : null
  const fileUrl = useMemo(() => (file && !error ? URL.createObjectURL(file) : null), [file, error])
  useEffect(() => () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
  }, [fileUrl])

  const urlValue = value.kind === 'url' ? value.url.trim() : ''
  const preview = value.kind === 'file' ? fileUrl : urlValue && isImageUrl(urlValue) ? urlValue : null
  const shown = preview ?? current

  return (
    <Box>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value.kind}
        onChange={(_, k: IconChoice['kind'] | null) => k && k !== value.kind && onChange(k === 'file' ? { kind: 'file', file: null } : { kind: 'url', url: '' })}
        aria-label="アイコンの指定方法"
        sx={{ mb: 1.5, '& .MuiToggleButton-root': { height: 40, px: 2, gap: 0.5 } }}
      >
        <ToggleButton value="file">
          <ImageOutlinedIcon fontSize="small" /> 画像を選択
        </ToggleButton>
        <ToggleButton value="url">
          <LinkIcon fontSize="small" /> 外部URL
        </ToggleButton>
      </ToggleButtonGroup>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        {/* プレビュー（未指定なら現在のアイコン、それも無ければ空の枠） */}
        <Box
          sx={{
            width: 56,
            height: 56,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: retro ? 0 : '50%',
            bgcolor: 'action.hover',
            overflow: 'hidden',
          }}
        >
          {shown && <UserIcon url={shown} size={56} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {value.kind === 'file' ? (
            <>
              <input
                ref={fileInput}
                type="file"
                accept={ICON_ACCEPT}
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onChange({ kind: 'file', file: f })
                  e.target.value = '' // 同じファイルを選び直せるように
                }}
              />
              <Button variant="outlined" onClick={() => fileInput.current?.click()} sx={{ height: 44 }}>
                画像を選ぶ
              </Button>
              <Typography
                variant="caption"
                component="div"
                color={error ? 'error' : 'text.secondary'}
                sx={{ mt: 0.75, overflowWrap: 'anywhere' }}
              >
                {error ?? (file ? file.name : 'png / jpg / gif / webp、5MBまで。正方形に切り抜いて保存されます')}
              </Typography>
            </>
          ) : (
            <TextField
              fullWidth
              size="small"
              label="画像のURL"
              placeholder="https://example.com/icon.png"
              value={value.url}
              onChange={(e) => onChange({ kind: 'url', url: e.target.value })}
              error={!!error}
              helperText={error ?? 'https で始まる .png / .jpg / .gif / .webp のURL。元のサイトから直接表示します'}
              slotProps={{ htmlInput: { maxLength: 1000, inputMode: 'url', autoCapitalize: 'none', spellCheck: false } }}
            />
          )}
        </Box>
      </Stack>
    </Box>
  )
}
