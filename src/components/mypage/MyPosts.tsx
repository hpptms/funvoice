import { Alert, Box, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { api } from '../../api/client'
import { formatRelative } from '../../lib/format'
import EmptyNote from './EmptyNote'
import Pager from './Pager'

/** マイページ: ログイン中に書いたコメント（どの作品・トピックに書いたか、返信の数） */
export default function MyPosts() {
  const [page, setPage] = useState(1)
  const q = useQuery({ queryKey: ['me', 'posts', page], queryFn: () => api.me.posts(page), placeholderData: keepPreviousData })
  if (q.isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
  if (q.isError) return <Alert severity="error">{(q.error as Error).message}</Alert>
  const data = q.data!
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        ログイン中に書いたコメントです（{data.total}件）。ログアウト中に書いたコメントはここに出ません。
      </Typography>
      {data.posts.length === 0 ? (
        <EmptyNote>まだコメントがありません。作品ページの掲示板で語ってみましょう。</EmptyNote>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {data.posts.map((p) => (
            <Box component="li" key={`${p.threadId}-${p.no}`} sx={{ py: 1.25, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}>
              <Typography variant="caption" color="text.secondary" component="p" sx={{ overflowWrap: 'anywhere' }}>
                <Link component={RouterLink} to={`/works/${p.workId}`} color="inherit">
                  {p.workTitle}
                </Link>
                {' › '}
                <Link component={RouterLink} to={`/threads/${p.threadId}`} color="inherit">
                  {p.threadTitle}
                </Link>
              </Typography>
              <Link component={RouterLink} to={p.url} color="inherit" sx={{ display: 'block', my: 0.25, overflowWrap: 'anywhere', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>{p.no}.</Box>
                {p.excerpt || '（画像・リンクのみ）'}
              </Link>
              <Stack direction="row" spacing={1.5} sx={{ fontSize: 12, color: 'text.secondary' }}>
                <span>{formatRelative(p.createdAt)}</span>
                {p.replyCount > 0 && (
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    返信 {p.replyCount}件
                  </Box>
                )}
                <span>＋{p.plus} / －{p.minus}</span>
              </Stack>
            </Box>
          ))}
        </Box>
      )}
      <Pager total={data.total} perPage={data.perPage} page={page} onChange={setPage} />
    </Box>
  )
}
