import { Box, Link, Typography, useMediaQuery, type Theme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { api, type Activity } from '../api/client'
import { afterPageLoad } from '../lib/afterPageLoad'
import { formatRelative } from '../lib/format'
import { useRetro } from '../lib/styleMode'
import { PIXEL_FONT } from '../theme'

/** 表示する件数（ランキングのボタンと下のリンクの2段分の高さに収まる数） */
const ROWS = 3
/** コメントの1ページの件数（backend の postsPerPage と同じ） */
const POSTS_PER_PAGE = 100

const LABEL = {
  sequel: { text: '続編希望', color: 'primary.main' },
  complete: { text: 'キレイに終わった', color: 'secondary.main' },
  post: { text: '書き込み', color: 'text.secondary' },
} as const

function target(a: Activity): string {
  if (a.kind === 'post' && a.threadId) {
    const page = Math.ceil((a.postNo ?? 1) / POSTS_PER_PAGE)
    return `/threads/${a.threadId}${page > 1 ? `?page=${page}` : ''}#p${a.postNo}`
  }
  return `/works/${a.workId}`
}

/**
 * トップのランキングの横に出す「最近の投票・書き込み」。PC幅（lg以上）だけ。
 * 誰がしたかは出さず、作品名と種類と時刻だけを出す。
 */
export default function RecentActivity() {
  // スマホ・タブレットでは出さないので取得もしない。PCでもページの読み込みが終わってから取る
  // （作品一覧・画像の読み込みと通信を取り合って、表示の速さの評価を下げないように）
  const wide = useMediaQuery((t: Theme) => t.breakpoints.up('lg'), { noSsr: true })
  const [loaded, setLoaded] = useState(false)
  useEffect(() => afterPageLoad(() => setLoaded(true)), [])
  const active = wide && loaded
  const { data } = useQuery({
    queryKey: ['activity'],
    queryFn: api.getActivity,
    enabled: active,
    // エッジでキャッシュされ、投票・書き込みがあると無効化されるので、1分ごとに取り直しても軽い
    refetchInterval: active ? 60_000 : false,
  })
  // 「〇分前」を進めるため1分ごとに描き直す
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [active])

  const items = (data?.items ?? []).slice(0, ROWS)
  const retro = useRetro()
  const ink = '#141414'

  return (
    // ホワイトボード風。レトロは他の枠と同じ黒い太枠＋ハード影、シンプルはアルミ枠風の角丸
    <Box
      component="section"
      aria-label="最近の投票・書き込み"
      sx={{
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        maxWidth: 460,
        mr: 1,
        // 左のランキングボタン・リンクより少し下げる
        position: 'relative',
        top: 10,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          // 中身が読み込まれる前後で高さが変わらないよう固定（CLS対策）
          height: ROWS * 20 + 18 + 10 + 6,
          px: 1.5,
          py: '5px',
          overflow: 'hidden',
          bgcolor: '#fff',
          // 表面のうっすらした光沢
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0) 40%, rgba(200,214,230,.18) 55%, rgba(255,255,255,0) 70%)',
          ...(retro
            ? { border: `2px solid ${ink}`, boxShadow: `4px 4px 0 ${ink}` }
            : {
                borderRadius: 2,
                border: '3px solid #c9ced6',
                boxShadow: 'inset 0 0 0 1px #eef1f5, 0 2px 8px rgba(0,0,0,.08)',
              }),
        }}
      >
        {/* 角のマグネット（飾り） */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 6,
            right: 8,
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            ...(retro ? { border: `2px solid ${ink}`, borderRadius: 0 } : { boxShadow: '0 1px 2px rgba(0,0,0,.3)' }),
          }}
        />
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: 'secondary.main',
            lineHeight: '18px',
            letterSpacing: '0.05em',
            ...(retro && { fontFamily: PIXEL_FONT, fontWeight: 400 }),
          }}
        >
          いま投票・書き込みがあったアニメ
        </Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {items.map((a) => {
          const label = LABEL[a.kind === 'vote' ? (a.choice ?? 'sequel') : 'post']
          return (
            <Box
              component="li"
              key={`${a.kind}-${a.workId}-${a.threadId}-${a.postNo}-${a.at}`}
              sx={{ display: 'flex', alignItems: 'baseline', gap: 1, fontSize: 12.5, lineHeight: '20px', whiteSpace: 'nowrap' }}
            >
              <Box component="span" sx={{ color: label.color, fontWeight: 700, flexShrink: 0 }}>
                {label.text}
              </Box>
              <Link
                component={RouterLink}
                to={target(a)}
                title={a.workTitle}
                sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', color: 'text.primary' }}
              >
                {a.workTitle}
              </Link>
              <Box component="span" sx={{ color: 'text.secondary', fontSize: 11, flexShrink: 0, ml: 'auto' }}>
                {formatRelative(a.at)}
              </Box>
            </Box>
          )
        })}
        {data && items.length === 0 && (
          <Box component="li" sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: '20px' }}>
            まだありません
          </Box>
        )}
      </Box>
      </Box>
    </Box>
  )
}
