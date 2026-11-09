import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { findEmbeds, niconicoPlayerUrl, vimeoPlayerUrl, type Embed } from '../../lib/embed'
import { useRetro } from '../../lib/styleMode'
import RemoteImage from '../RemoteImage'
import { YouTubeEmbed } from '../works/WorkMedia'

/**
 * コメント本文に貼られたURLのうち、画像・動画と判定できたものをプレビュー表示する。
 *
 * - 画像は元のサイトから直接表示する（自サイトにはコピーを持たない）。Referer は送らず、読み込めなければ非表示
 * - 動画はどれも、押すまで外部のプレーヤー・ファイルを読み込まない（表示を軽くし、外部への通信を減らす）
 */
export default function PostEmbeds({ body, compact = false }: { body: string; compact?: boolean }) {
  const embeds = findEmbeds(body)
  if (embeds.length === 0) return null
  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      {embeds.map((e) => (
        <EmbedView key={'id' in e ? `${e.type}:${e.id}` : e.url} embed={e} compact={compact} />
      ))}
    </Stack>
  )
}

function EmbedView({ embed, compact }: { embed: Embed; compact: boolean }) {
  switch (embed.type) {
    case 'image':
      return <RemoteImage url={embed.url} maxHeight={compact ? 180 : 320} />
    case 'youtube':
      return (
        <Box sx={{ maxWidth: compact ? 320 : 480 }}>
          <YouTubeEmbed id={embed.id} title="YouTube" />
        </Box>
      )
    case 'vimeo':
      return <PlayerFacade label="Vimeo" playerUrl={vimeoPlayerUrl(embed.id)} compact={compact} />
    case 'niconico':
      return <PlayerFacade label="ニコニコ動画" playerUrl={niconicoPlayerUrl(embed.id)} compact={compact} />
    case 'video':
      return (
        <Box
          component="video"
          src={embed.url}
          controls
          preload="none"
          playsInline
          sx={{ display: 'block', width: '100%', maxWidth: compact ? 320 : 480, aspectRatio: '16 / 9', bgcolor: '#000' }}
        />
      )
  }
}

/** Vimeo・ニコニコ動画: 押したときに初めて公式プレーヤーを読み込む */
function PlayerFacade({ label, playerUrl, compact }: { label: string; playerUrl: string; compact: boolean }) {
  const retro = useRetro()
  const [playing, setPlaying] = useState(false)
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: compact ? 320 : 480,
        aspectRatio: '16 / 9',
        bgcolor: '#111',
        borderRadius: retro ? 0 : 2,
        overflow: 'hidden',
      }}
    >
      {playing ? (
        <Box
          component="iframe"
          src={playerUrl}
          title={`${label}の動画`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      ) : (
        <ButtonBase onClick={() => setPlaying(true)} aria-label={`${label}の動画を再生`} sx={{ position: 'absolute', inset: 0, flexDirection: 'column', gap: 1, color: '#fff' }}>
          <Box sx={{ width: 64, height: 46, borderRadius: retro ? 0 : 3, bgcolor: 'rgba(255,255,255,.15)', display: 'grid', placeItems: 'center' }}>
            <PlayArrowRoundedIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography variant="body2" sx={{ color: '#fff' }}>
            {label}の動画を再生
          </Typography>
        </ButtonBase>
      )}
    </Box>
  )
}
