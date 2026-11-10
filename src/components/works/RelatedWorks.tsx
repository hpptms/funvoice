import { Box, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { MEDIA_LABEL, type RelatedWork } from '../../api/client'
import { seasonNameLabel } from '../../lib/season'
import { useRetro } from '../../lib/styleMode'

/** 作品へのリンクの一覧（シリーズ・同じ放送時期の作品）。currentId の作品は「この作品」と表示してリンクにしない */
export default function RelatedWorks({ works, currentId, showSeason }: { works: RelatedWork[]; currentId?: number; showSeason?: boolean }) {
  const retro = useRetro()
  return (
    <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
      {works.map((w) => {
        const current = w.id === currentId
        const meta = [
          w.summary,
          showSeason ? seasonNameLabel(w.seasonName) : null,
          MEDIA_LABEL[w.media] ?? null,
        ].filter(Boolean)
        return (
          <Stack
            component="li"
            key={w.id}
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ py: 0.75, gap: { xs: 0.25, sm: 1.5 }, alignItems: { sm: 'baseline' }, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}
          >
            <Box sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
              {current ? (
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {retro ? '> ' : ''}
                  {w.title}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    （この作品）
                  </Typography>
                </Typography>
              ) : (
                <Link component={RouterLink} to={`/works/${w.id}`} color="inherit">
                  {w.title}
                </Link>
              )}
              {meta.length > 0 && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {meta.join(' / ')}
                </Typography>
              )}
            </Box>
            <Typography variant="caption" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Box component="span" sx={{ color: 'primary.main' }}>
                続編希望 {w.sequel}
              </Box>
              {' / '}
              <Box component="span" sx={{ color: 'secondary.main' }}>
                キレイに終わった {w.complete}
              </Box>
            </Typography>
          </Stack>
        )
      })}
    </Box>
  )
}
