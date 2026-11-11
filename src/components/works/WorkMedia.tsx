import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { Box, ButtonBase, Link, Typography } from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { Work } from '../../api/client'
import { useRetro } from '../../lib/styleMode'
import { youtubeEmbedUrl, youtubeThumbnail } from '../../lib/youtube'
import PostImage from '../bbs/PostImage'
import RemoteImage from '../RemoteImage'

/** YouTube の動画。最初はサムネイルだけを表示し、押したときに初めてプレーヤーを読み込む（軽量化・外部通信の抑制） */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  const retro = useRetro()
  const [playing, setPlaying] = useState(false)
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 720,
        aspectRatio: '16 / 9',
        bgcolor: '#000',
        borderRadius: retro ? 0 : 2,
        overflow: 'hidden',
        ...(retro ? { border: 2, borderColor: 'divider' } : {}),
      }}
    >
      {playing ? (
        <Box
          component="iframe"
          src={youtubeEmbedUrl(id)}
          title={`${title}（YouTube）`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      ) : (
        <ButtonBase onClick={() => setPlaying(true)} aria-label={`${title}の動画を再生`} sx={{ position: 'absolute', inset: 0 }}>
          <Box
            component="img"
            src={youtubeThumbnail(id)}
            alt=""
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 68,
              height: 48,
              borderRadius: retro ? 0 : 3,
              bgcolor: 'rgba(0,0,0,.75)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <PlayArrowRoundedIcon sx={{ fontSize: 36 }} />
          </Box>
        </ButtonBase>
      )}
    </Box>
  )
}

/** 紹介メディア下の権利表記。公式映像が無い作品では公式絵・ファンアートを載せることがあるため */
function RightsNotice() {
  return (
    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
      公式映像が無い場合、公式絵、ファンアートを表示する場合があります。
      権利の問題がある場合はお手数をおかけしますが、
      <Link component={RouterLink} to="/contact?category=copyright">
        お問い合わせ
      </Link>
      ください。
    </Typography>
  )
}

/** 作品の紹介メディア（YouTube か画像のどちらか）。無ければ何も表示しない */
export default function WorkMedia({ work }: { work: Work }) {
  if (work.youtubeId) {
    return (
      <Box>
        <YouTubeEmbed id={work.youtubeId} title={work.title} />
        <Typography variant="caption" color="text.secondary" component="p">
          再生すると YouTube（youtube-nocookie.com）から動画を読み込みます
        </Typography>
        <RightsNotice />
      </Box>
    )
  }
  if (work.imageUrl)
    return (
      <Box>
        <RemoteImage url={work.imageUrl} alt={`${work.title}の画像`} maxHeight={420} />
        <RightsNotice />
      </Box>
    )
  // 以前にアップロードされた画像（アップロードは終了。既存データの表示用）
  if (work.image)
    return (
      <Box>
        <PostImage image={work.image} alt={`${work.title}の画像`} maxHeight={420} />
        <RightsNotice />
      </Box>
    )
  return null
}
