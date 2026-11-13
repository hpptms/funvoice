import { Box, Link, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { api, type Activity } from '../api/client'
import { formatRelative } from '../lib/format'

/** 表示する件数（ランキングのボタンと下のリンクの2段分の高さに収まる数） */
const ROWS = 4
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
  const { data } = useQuery({
    queryKey: ['activity'],
    queryFn: api.getActivity,
    // エッジでキャッシュされ、投票・書き込みがあると無効化されるので、1分ごとに取り直しても軽い
    refetchInterval: 60_000,
  })
  // 「〇分前」を進めるため1分ごとに描き直す
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const items = (data?.items ?? []).slice(0, ROWS)

  return (
    <Box
      component="section"
      aria-label="最近の投票・書き込み"
      sx={{
        display: { xs: 'none', lg: 'block' },
        flex: 1,
        minWidth: 0,
        maxWidth: 440,
        // 中身が読み込まれる前後で高さが変わらないよう固定（CLS対策）
        height: ROWS * 21 + 22,
        borderLeft: 1,
        borderColor: 'divider',
        pl: 2,
        overflow: 'hidden',
      }}
    >
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', lineHeight: '20px', letterSpacing: '0.05em' }}>
        いま投票・書き込みがあったアニメ
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {items.map((a) => {
          const label = LABEL[a.kind === 'vote' ? (a.choice ?? 'sequel') : 'post']
          return (
            <Box
              component="li"
              key={`${a.kind}-${a.workId}-${a.threadId}-${a.postNo}-${a.at}`}
              sx={{ display: 'flex', alignItems: 'baseline', gap: 1, fontSize: 12.5, lineHeight: '21px', whiteSpace: 'nowrap' }}
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
          <Box component="li" sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: '21px' }}>
            まだありません
          </Box>
        )}
      </Box>
    </Box>
  )
}
