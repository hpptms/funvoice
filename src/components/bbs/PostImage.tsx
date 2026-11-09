import CloseIcon from '@mui/icons-material/Close'
import { Box, ButtonBase, CircularProgress, Dialog, IconButton } from '@mui/material'
import { useEffect, useState } from 'react'
import type { Post } from '../../api/client'
import { getLocalImage, releaseLocalImage } from '../../lib/localImages'
import { useRetro } from '../../lib/styleMode'

// 変換済みの画像が取れなかったときの再試行の間隔（ミリ秒）
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000]

/**
 * コメントの画像。タップ/クリックで拡大表示する。
 *
 * 投稿した本人のブラウザでは、Cloudinary の WebP 変換が終わって表示できるまで、
 * 選んだファイル（手元の画像）を表示しておき、届いたら差し替える。
 */
export default function PostImage({ image, alt, maxHeight = 360 }: { image: NonNullable<Post['image']>; alt: string; maxHeight?: number }) {
  const retro = useRetro()
  const [open, setOpen] = useState(false)
  const [local] = useState(() => getLocalImage(image.id))
  const [remoteReady, setRemoteReady] = useState(!local)

  // 手元の画像を表示している間に、裏で変換済みの画像を読み込む（変換が間に合わなければ少し待って再試行）
  useEffect(() => {
    if (!local) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const load = (attempt: number) => {
      const img = new Image()
      img.onload = () => {
        if (cancelled) return
        setRemoteReady(true)
        // 表示が切り替わってから解放する
        timer = setTimeout(() => releaseLocalImage(image.id), 1000)
      }
      img.onerror = () => {
        if (cancelled || attempt >= RETRY_DELAYS.length) return
        timer = setTimeout(() => load(attempt + 1), RETRY_DELAYS[attempt])
      }
      img.src = attempt === 0 ? image.url : `${image.url}?retry=${attempt}`
    }
    load(0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [local, image.id, image.url])

  const src = remoteReady || !local ? image.url : local
  const fullSrc = remoteReady || !local ? image.fullUrl : local

  // 縦横比を保ったまま maxHeight に収まる表示幅。読み込み前から場所を確保して、レイアウトがずれないようにする
  const ratio = image.width && image.height ? image.width / image.height : null
  const displayWidth = ratio ? Math.min(image.width, maxHeight * ratio) : null
  return (
    <>
      <ButtonBase
        onClick={() => setOpen(true)}
        aria-label={`${alt}を拡大`}
        sx={{
          position: 'relative',
          display: 'block',
          mt: 1,
          maxWidth: '100%',
          // 外側に表示幅を固定する（内側の%指定と循環して、読み込み前に小さく計算されるのを防ぐ）
          width: displayWidth ? `${Math.round(displayWidth)}px` : 'fit-content',
          borderRadius: retro ? 0 : 2,
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={src}
          alt={alt}
          // 縦横比を先に伝えて、読み込み中にレイアウトがずれないようにする
          width={image.width || undefined}
          height={image.height || undefined}
          loading={local ? 'eager' : 'lazy'}
          decoding="async"
          sx={{
            display: 'block',
            maxWidth: '100%',
            ...(ratio && displayWidth
              ? { width: '100%', height: 'auto', aspectRatio: `${image.width} / ${image.height}` }
              : { width: 'auto', height: 'auto', maxHeight }),
            objectFit: 'contain',
            bgcolor: 'action.hover',
            ...(retro ? { border: 2, borderColor: 'divider' } : {}),
          }}
        />
        {!remoteReady && (
          // 手元の画像を表示中（変換待ち）であることを小さく示す
          // 画像の色に関係なく見えるよう、暗い丸の上に出す
          <Box
            sx={{
              position: 'absolute',
              right: 8,
              bottom: 8,
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <CircularProgress size={16} thickness={5} aria-label="画像を最適化しています" sx={{ color: '#fff' }} />
          </Box>
        )}
      </ButtonBase>
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
        <Box
          component="img"
          src={fullSrc}
          alt={alt}
          onClick={() => setOpen(false)}
          sx={{ display: 'block', maxWidth: 'calc(100vw - 16px)', maxHeight: 'calc(100vh - 16px)', objectFit: 'contain' }}
        />
      </Dialog>
    </>
  )
}
