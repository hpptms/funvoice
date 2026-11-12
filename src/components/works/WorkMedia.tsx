import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { Box, ButtonBase, Link, Typography } from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { Work } from '../../api/client'
import { NO_MEDIA_IMAGE } from '../../lib/media'
import { useRetro } from '../../lib/styleMode'
import { youtubeEmbedUrl, youtubeThumbnail } from '../../lib/youtube'
import PostImage from '../bbs/PostImage'

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
      <Link component={RouterLink} to="/copyright">
        著作権・削除依頼
      </Link>
      をご確認のうえ、
      <Link component={RouterLink} to="/contact?category=copyright">
        削除依頼フォーム
      </Link>
      からお問い合わせください。
    </Typography>
  )
}

/** 紹介画像の引用元（元の画像URL）。サイト名が分かるよう、ホスト名を先に示してURL全体をリンクにする */
function ImageSource({ url }: { url: string }) {
  let host = ''
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    host = u.hostname
  } catch {
    return null
  }
  return (
    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
      画像の引用元（{host}）：
      <Link href={url} target="_blank" rel="noopener noreferrer nofollow ugc" referrerPolicy="no-referrer">
        {url}
      </Link>
    </Typography>
  )
}

/** 紹介メディアが無い作品に出す「参考画像がありません」の画像 */
function NoMediaImage() {
  const retro = useRetro()
  return (
    <Box
      component="img"
      src={NO_MEDIA_IMAGE}
      alt="参考画像がありません"
      width={1672}
      height={941}
      decoding="async"
      sx={{
        display: 'block',
        width: '100%',
        maxWidth: 720,
        height: 'auto',
        aspectRatio: '1672 / 941',
        borderRadius: retro ? 0 : 2,
        ...(retro ? { border: 2, borderColor: 'divider' } : {}),
      }}
    />
  )
}

/** 作品の紹介メディア（YouTube か画像のどちらか）。無ければ「参考画像がありません」の画像を表示する */
export default function WorkMedia({ work }: { work: Work }) {
  if (work.youtubeId) {
    return (
      <Box>
        <YouTubeEmbed id={work.youtubeId} title={work.title} />
        {work.video && (
          <Typography variant="body2" component="p" sx={{ mt: 0.75, maxWidth: 720, overflowWrap: 'anywhere' }}>
            {work.video.title}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" component="p">
          再生すると YouTube（youtube-nocookie.com）から動画を読み込みます
        </Typography>
        <RightsNotice />
      </Box>
    )
  }
  // 画像は Cloudinary に取り込んだもの（WebP）を表示し、元の画像URLは引用元として明記する。
  // 取り込み待ち・取り込み失敗の作品は、外部サイトの画像を直接表示せず「参考画像がありません」にする
  if (work.image)
    return (
      <Box>
        <PostImage image={work.image} alt={`${work.title}の画像`} maxHeight={420} />
        {work.imageUrl && <ImageSource url={work.imageUrl} />}
        <RightsNotice />
      </Box>
    )
  return <NoMediaImage />
}
