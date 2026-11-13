import { Alert, Box, Chip, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { CHOICE_LABEL, MEDIA_LABEL, api } from '../../api/client'
import { formatRelative } from '../../lib/format'
import { seasonNameLabel } from '../../lib/season'
import EmptyNote from './EmptyNote'
import Pager from './Pager'

/** マイページ: 投票した作品（新しい順）。続編が発表された作品には印を付ける */
export default function MyVotes() {
  const [page, setPage] = useState(1)
  const q = useQuery({ queryKey: ['me', 'votes', page], queryFn: () => api.me.votes(page), placeholderData: keepPreviousData })
  if (q.isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
  if (q.isError) return <Alert severity="error">{(q.error as Error).message}</Alert>
  const data = q.data!
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        ログイン中に投票した作品と、このブラウザでログイン前に投票した作品です（{data.total}作品）。
        続編希望に投票した作品の続編が発表されると、通知でお知らせします。
      </Typography>
      {data.votes.length === 0 ? (
        <EmptyNote>
          まだ投票がありません。<Link component={RouterLink} to="/">作品を探して投票する</Link>
        </EmptyNote>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {data.votes.map((v) => {
            const meta = [seasonNameLabel(v.work.seasonName), MEDIA_LABEL[v.work.media]].filter(Boolean).join(' / ')
            return (
              <Box component="li" key={v.work.id} sx={{ py: 1.25, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}>
                <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                  <Chip
                    size="small"
                    label={CHOICE_LABEL[v.choice]}
                    sx={{
                      fontWeight: 700,
                      bgcolor: v.choice === 'sequel' ? 'primary.main' : 'secondary.main',
                      color: '#fff',
                      borderColor: 'transparent',
                    }}
                  />
                  {v.sequelAnnounced && <Chip size="small" color="success" variant="outlined" label="続編あり" />}
                  <Typography variant="caption" color="text.secondary">
                    {formatRelative(v.votedAt)}
                  </Typography>
                </Stack>
                <Link component={RouterLink} to={`/works/${v.work.id}`} color="inherit" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                  {v.work.title}
                </Link>
                <Typography variant="caption" color="text.secondary" component="p">
                  {meta && `${meta}　`}
                  <Box component="span" sx={{ color: 'primary.main' }}>続編希望 {v.work.sequel}</Box>
                  {' / '}
                  <Box component="span" sx={{ color: 'secondary.main' }}>キレイに終わった {v.work.complete}</Box>
                </Typography>
              </Box>
            )
          })}
        </Box>
      )}
      <Pager total={data.total} perPage={data.perPage} page={page} onChange={setPage} />
    </Box>
  )
}
