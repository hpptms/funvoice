import ForumIcon from '@mui/icons-material/Forum'
import { Box, Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { api } from '../api/client'
import { formatRelative } from '../lib/format'
import { useRetro } from '../lib/styleMode'
import { PIXEL_FONT } from '../theme'
import { TitleBar } from './Retro'

/** カードに出す新しいコメントの件数（backend の loungePreview と同じ） */
const ROWS = 3
const ROW_HEIGHT = 20

/**
 * トップの作品一覧の先頭に出す「雑談掲示板」の入口。作品カードと同じ形・大きさにして一覧に並べる。
 * 中身は作品の掲示板と同じトピックのページ（/threads/:id）で、作品に紐づかないだけ。
 */
export default function LoungeCard() {
  const retro = useRetro()
  const { data } = useQuery({
    queryKey: ['lounge'],
    queryFn: api.getLounge,
    // エッジでキャッシュされ、書き込みがあると無効化されるので、1分ごとに取り直しても軽い
    refetchInterval: 60_000,
  })
  const posts = (data?.posts ?? []).slice(0, ROWS)
  const to = data ? `/threads/${data.thread.id}` : undefined

  const inner = (
    <>
      {retro && (
        <TitleBar>
          <Box component="span" sx={{ bgcolor: 'primary.main', color: '#fff', px: 0.5, py: 0.25, mr: 0.75 }}>
            雑談
          </Box>
          #lounge 雑談・配信情報
        </TitleBar>
      )}
      {/* 作品カードのサムネイルと同じ 16:9 の見出し */}
      <Box
        sx={{
          aspectRatio: '16 / 9',
          display: 'grid',
          placeItems: 'center',
          alignContent: 'center',
          gap: 1,
          px: 2,
          textAlign: 'center',
          color: '#fff',
          bgcolor: 'primary.main',
          backgroundImage: retro
            ? 'repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 1px, transparent 1px 12px), repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 1px, transparent 1px 12px)'
            : 'linear-gradient(135deg, rgba(255,255,255,.18), rgba(0,0,0,.12))',
          ...(retro ? { borderBottom: 2, borderColor: 'divider' } : {}),
        }}
      >
        <ForumIcon aria-hidden sx={{ fontSize: 44 }} />
        <Typography
          sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.5, ...(retro && { fontFamily: PIXEL_FONT, fontWeight: 400 }) }}
        >
          「このアニメ、どこで見られる？」
          <br />
          配信情報の交換も、ただの雑談も
        </Typography>
      </Box>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
        {!retro && (
          <div>
            <Chip label="雑談" size="small" color="primary" sx={{ fontWeight: 700 }} />
          </div>
        )}
        <Typography
          component="h2"
          sx={
            retro
              ? { fontFamily: PIXEL_FONT, fontSize: 17, lineHeight: 1.45 }
              : { fontWeight: 700, fontSize: 16, lineHeight: 1.5 }
          }
        >
          雑談掲示板
        </Typography>
        {/* 読み込みの前後で高さが変わらないよう固定（CLS対策） */}
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, height: ROWS * ROW_HEIGHT, overflow: 'hidden' }}>
          {data && posts.length === 0 && (
            <Box component="li" sx={{ fontSize: 12.5, lineHeight: `${ROW_HEIGHT}px`, color: 'text.secondary' }}>
              {retro ? '> no posts yet' : 'まだ書き込みがありません。最初の一言をどうぞ'}
            </Box>
          )}
          {posts.map((p) => (
            <Box
              component="li"
              key={p.id}
              sx={{ display: 'flex', gap: 1, fontSize: 12.5, lineHeight: `${ROW_HEIGHT}px`, whiteSpace: 'nowrap' }}
            >
              <Box component="span" sx={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.body || '（画像・動画）'}
              </Box>
              <Box component="span" sx={{ flexShrink: 0, color: 'text.secondary', fontSize: 11.5 }}>
                {formatRelative(p.createdAt)}
              </Box>
            </Box>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" component="div">
          {data ? (retro ? `${data.thread.postCount} comments` : `${data.thread.postCount}コメント`) : ' '}
          {' / '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            {retro ? '> 書き込む' : '書き込む →'}
          </Box>
        </Typography>
      </CardContent>
    </>
  )

  return (
    <Card
      component="section"
      aria-label="雑談掲示板"
      sx={{
        transition: 'transform .12s, box-shadow .12s',
        '&:hover': retro
          ? { transform: 'translate(-2px, -2px)', boxShadow: (t) => `6px 6px 0 ${t.vars!.palette.primary.main}` }
          : { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.10)' },
      }}
    >
      {to ? (
        <CardActionArea
          component={RouterLink}
          to={to}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          {inner}
        </CardActionArea>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>{inner}</Box>
      )}
    </Card>
  )
}
