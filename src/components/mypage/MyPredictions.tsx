import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { Alert, Box, Chip, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { api } from '../../api/client'
import { formatDateTime } from '../../lib/format'
import { nextPredictionBadge, predictionBadge } from '../../lib/predictions'
import EmptyNote from './EmptyNote'
import Pager from './Pager'

/** マイページ: 続編予想の成績とバッジ、予想の一覧 */
export default function MyPredictions() {
  const [page, setPage] = useState(1)
  const q = useQuery({ queryKey: ['me', 'predictions', page], queryFn: () => api.me.predictions(page), placeholderData: keepPreviousData })
  if (q.isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
  if (q.isError) return <Alert severity="error">{(q.error as Error).message}</Alert>
  const data = q.data!
  const badge = predictionBadge(data.stats.yesHits)
  const next = nextPredictionBadge(data.stats.yesHits)
  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1, mb: 2 }}>
        {[
          ['発表を的中', data.stats.yesHits],
          ['的中（合計）', data.stats.hits],
          ['はずれ', data.stats.misses],
          ['結果待ち', data.stats.pending],
        ].map(([label, n]) => (
          <Box key={label} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 22 }}>{n}</Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <EmojiEventsIcon sx={{ color: badge ? '#F2B705' : 'text.disabled' }} aria-hidden />
        <Typography sx={{ fontWeight: 700 }}>{badge ?? 'バッジはまだありません'}</Typography>
        {next && (
          <Typography variant="caption" color="text.secondary">
            あと{next.remaining}回「発表される」を当てると「{next.label}」
          </Typography>
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        作品ページで「1年以内に続編が発表されるか」を予想できます。予想してから24時間は変更でき、その後は締め切り（1年後）まで固定です。
      </Typography>
      {data.predictions.length === 0 ? (
        <EmptyNote>まだ予想がありません。気になる作品のページで予想してみましょう。</EmptyNote>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {data.predictions.map((p) => (
            <Box component="li" key={p.work.id} sx={{ py: 1.25, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}>
              <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                <Chip size="small" variant="outlined" label={p.willAnnounce ? '発表される' : '発表されない'} />
                {p.result === 'hit' && <Chip size="small" color="success" label="的中！" />}
                {p.result === 'miss' && <Chip size="small" label="はずれ" />}
                {!p.result && (
                  <Typography variant="caption" color="text.secondary">
                    締め切り {formatDateTime(p.deadline, false).slice(0, 10)}
                  </Typography>
                )}
              </Stack>
              <Link component={RouterLink} to={`/works/${p.work.id}`} color="inherit" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                {p.work.title}
              </Link>
            </Box>
          ))}
        </Box>
      )}
      <Pager total={data.total} perPage={data.perPage} page={page} onChange={setPage} />
    </Box>
  )
}
