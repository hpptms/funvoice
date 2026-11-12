import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { Box } from '@mui/material'
import { useState } from 'react'
import type { Work } from '../../api/client'
import { NO_MEDIA_THUMB } from '../../lib/media'
import { useRetro } from '../../lib/styleMode'
import { youtubeCardThumbnail } from '../../lib/youtube'

/**
 * 一覧のカード上部に出す、作品の紹介メディアのサムネイル（16:9）。
 * YouTube はサムネイルに再生マークを重ねる（カードを押すと作品ページへ移動し、そこで再生できる）。
 * 添付が無い作品・画像が読み込めない作品では「参考画像がありません」の画像を表示する。
 */
export default function WorkCardMedia({ work, priority = false }: { work: Work; priority?: boolean }) {
  const retro = useRetro()
  // 画像が読み込めない場合は、代わりの画像にする
  const [failed, setFailed] = useState(false)
  // 画像は Cloudinary に取り込んだもの（WebP）だけを表示する。外部サイトの画像は直接表示しない
  const media = work.image
    ? work.image.thumbUrl
    : work.youtubeId
      ? youtubeCardThumbnail(work.youtubeId)
      : null
  const src = !media || failed ? NO_MEDIA_THUMB : media
  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio: '16 / 9',
        bgcolor: 'action.hover',
        overflow: 'hidden',
        ...(retro ? { borderBottom: 2, borderColor: 'divider' } : {}),
      }}
    >
      <Box
        component="img"
        src={src}
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => src !== NO_MEDIA_THUMB && setFailed(true)}
        width={480}
        height={270}
        sx={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform .3s',
          '.MuiCardActionArea-root:hover &': { transform: 'scale(1.03)' },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      />
      {work.youtubeId && !work.image && !failed && (
        <Box
          aria-label="PV動画あり"
          sx={{
            position: 'absolute',
            left: 8,
            bottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            pl: 0.25,
            pr: 1,
            height: 26,
            borderRadius: retro ? 0 : 99,
            bgcolor: 'rgba(0, 0, 0, 0.72)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          <PlayArrowRoundedIcon sx={{ fontSize: 20 }} />
          PV
        </Box>
      )}
    </Box>
  )
}
