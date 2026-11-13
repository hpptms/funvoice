import { Alert, Box, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { MEDIA_LABEL, api, type SequelAchievement } from '../api/client'
import { Prompt, Window } from '../components/Retro'
import { TallyBar } from '../components/VoteTally'
import { SEQUELS_DESCRIPTION, SEQUELS_MIN_ITEMS, SEQUELS_TITLE } from '../../edge/seo'
import { formatDateTime } from '../lib/format'
import { takeInitialData, usePageMeta } from '../lib/pageMeta'
import { seasonNameLabel } from '../lib/season'
import { useRetro } from '../lib/styleMode'

/** /sequels FanVoice で続編希望の声があった作品の続編決定（発表時点の票と一緒に） */
export default function SequelsPage() {
  const [initial] = useState(() => takeInitialData<{ sequels: SequelAchievement[] }>('fv-initial-sequels', () => true))
  const q = useQuery({ queryKey: ['sequels'], queryFn: api.getSequels, initialData: initial })
  usePageMeta({ title: SEQUELS_TITLE, description: SEQUELS_DESCRIPTION, noindex: (q.data?.sequels.length ?? 0) < SEQUELS_MIN_ITEMS })
  const retro = useRetro()

  return (
    <Stack spacing={3}>
      <Box>
        <Prompt>grep -r "続編決定" ./works</Prompt>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, lineHeight: 1.4 }}>
          続編決定アニメ一覧
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
          {retro && '// '}
          FanVoiceで「続編希望」の声が集まっていた作品の、続編決定の記録です。票は発表を確認した時点のものです。
        </Typography>
      </Box>
      {q.isLoading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />}
      {q.isError && <Alert severity="error">{(q.error as Error).message}</Alert>}
      {q.data && (
        <Window file="sequels.log" title="続編が決まった作品">
          {q.data.sequels.length === 0 ? (
            <Typography color="text.secondary">
              まだ記録がありません。気になる作品に「続編希望」を投票すると、続編が発表されたときにここに載ります（ログイン中の投票は通知も届きます）。
            </Typography>
          ) : (
            <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {q.data.sequels.map((a) => (
                <Box component="li" key={a.id} sx={{ py: 1.5, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(a.announcedAt, false).slice(0, 10)} 発表を確認
                  </Typography>
                  <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                    <Link component={RouterLink} to={`/works/${a.work.id}`} color="inherit">
                      {a.work.title}
                    </Link>
                    {' → '}
                    {a.sequelWork ? (
                      <Link component={RouterLink} to={`/works/${a.sequelWork.id}`} color="primary">
                        {a.sequelWork.title}
                      </Link>
                    ) : (
                      <Box component="span" sx={{ color: 'primary.main' }}>
                        続編決定
                      </Box>
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="p">
                    {[
                      a.sequelWork && seasonNameLabel(a.sequelWork.seasonName),
                      a.sequelWork && MEDIA_LABEL[a.sequelWork.media],
                      a.note,
                    ]
                      .filter(Boolean)
                      .join(' / ')}
                  </Typography>
                  <Box sx={{ mt: 0.75, maxWidth: 420 }}>
                    <TallyBar count={{ sequel: a.sequelVotes, complete: a.completeVotes }} height={8} />
                    <Typography variant="caption">
                      <Box component="span" sx={{ color: 'primary.main' }}>続編希望 {a.sequelVotes}</Box>
                      {' / '}
                      <Box component="span" sx={{ color: 'secondary.main' }}>キレイに終わった {a.completeVotes}</Box>
                      <Box component="span" sx={{ color: 'text.secondary' }}>（発表時点）</Box>
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Window>
      )}
      <Link component={RouterLink} to="/finales" color="secondary" sx={{ alignSelf: 'flex-start' }}>
        {retro ? '> ' : ''}今週最終回のアニメに投票する
      </Link>
    </Stack>
  )
}
