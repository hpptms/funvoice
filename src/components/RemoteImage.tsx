import CloseIcon from '@mui/icons-material/Close'
import { Box, ButtonBase, Dialog, IconButton, Link, Typography } from '@mui/material'
import { useState } from 'react'
import { useRetro } from '../lib/styleMode'

/**
 * 外部サイトの画像（コメントに貼られた画像・作品の紹介画像）。元のサイトから直接表示し、自サイトにはコピーを持たない。
 * Referer は送らない。読み込めない（画像ではない・削除された）場合は何も表示しない。タップで拡大。
 * showSource を付けると、ホスト名の代わりに引用元のURLをリンクで表示する（作品の紹介画像用）。
 */
export default function RemoteImage({
  url,
  maxHeight,
  alt = 'コメントに貼られた画像',
  showSource = false,
}: {
  url: string
  maxHeight: number
  alt?: string
  showSource?: boolean
}) {
  const retro = useRetro()
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  if (failed) return null
  const img = (sx: object, onClick?: () => void) => (
    <Box
      component="img"
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      onClick={onClick}
      sx={sx}
    />
  )
  return (
    <>
      <ButtonBase
        onClick={() => setOpen(true)}
        aria-label="貼られた画像を拡大"
        sx={{ display: 'block', width: 'fit-content', maxWidth: '100%', borderRadius: retro ? 0 : 2, overflow: 'hidden' }}
      >
        {img({
          display: 'block',
          maxWidth: '100%',
          maxHeight,
          minWidth: 48,
          minHeight: 48,
          objectFit: 'contain',
          bgcolor: 'action.hover',
          ...(retro ? { border: 2, borderColor: 'divider' } : {}),
        })}
      </ButtonBase>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ overflowWrap: 'anywhere' }}>
        {showSource && /^https?:\/\//i.test(url) ? (
          <>
            引用元：
            <Link href={url} target="_blank" rel="noopener noreferrer nofollow ugc" referrerPolicy="no-referrer">
              {url}
            </Link>
          </>
        ) : (
          <>{new URL(url).hostname} の画像</>
        )}
      </Typography>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={false}
        slotProps={{ paper: { sx: { bgcolor: 'transparent', boxShadow: 'none', m: 1, border: 0 } } }}
      >
        <IconButton
          aria-label="閉じる"
          onClick={() => setOpen(false)}
          sx={{ position: 'fixed', top: 12, right: 12, bgcolor: 'rgba(0,0,0,.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,.8)' } }}
        >
          <CloseIcon />
        </IconButton>
        {img({ display: 'block', maxWidth: 'calc(100vw - 16px)', maxHeight: 'calc(100vh - 16px)', objectFit: 'contain' }, () => setOpen(false))}
      </Dialog>
    </>
  )
}
