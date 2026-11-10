import { Alert, Box, Chip, CircularProgress, Link, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom'
import { api, type Ranking, type Work } from '../api/client'
import { Cursor, Prompt, Window } from '../components/Retro'
import { TallyBar } from '../components/VoteTally'
import WorkCard from '../components/WorkCard'
import {
  RANKING_MIN_WORKS,
  isRankingKind,
  isSeasonName,
  rankingDescription,
  rankingPath,
  rankingTitle,
  recentSeasonNames,
  seasonLabelFromSlug,
  type RankingKind,
} from '../../edge/seo'
import { takeInitialData, usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'
import { PIXEL_FONT } from '../theme'
import NotFoundPage from './NotFoundPage'

/** /ranking/:kind/:season? 「2期が見たいアニメランキング」「キレイに終わったアニメランキング」と放送時期別 */
export default function RankingPage() {
  const { kind, season } = useParams()
  if (!kind) return <Navigate to={rankingPath('sequel')} replace />
  if (!isRankingKind(kind) || (season !== undefined && !isSeasonName(season))) return <NotFoundPage />
  return <RankingView key={`${kind}/${season ?? ''}`} kind={kind} season={season} />
}

function RankingView({ kind, season }: { kind: RankingKind; season?: string }) {
  const retro = useRetro()
  const navigate = useNavigate()
  // Pages Functions がHTMLに埋め込んだランキング（同じ種類・時期のときだけ使う）
  const [initial] = useState(() =>
    takeInitialData<Ranking>('fv-initial-ranking', (d) => d.kind === kind && d.season === (season ?? '')),
  )
  const query = useQuery({
    queryKey: ['ranking', kind, season ?? ''],
    queryFn: () => api.getRanking(kind, season),
    initialData: initial,
  })
  const title = rankingTitle(kind, season)
  const description = rankingDescription(kind, season)
  const data = query.data
  usePageMeta({ title, description, noindex: !!data && data.works.length < RANKING_MIN_WORKS })

  const seasons = recentSeasonNames(8)
  if (season && !seasons.includes(season)) seasons.push(season)
  const accent = kind === 'sequel' ? 'primary' : 'secondary'
  const count = (w: Work) => (kind === 'sequel' ? w.tally.total.sequel : w.tally.total.complete)

  return (
    <Stack spacing={3}>
      <Box>
        <Prompt>./ranking --{kind}{season ? ` --season=${season}` : ''}</Prompt>
        <Typography variant="h5" component="h1" sx={{ fontSize: { xs: 22, md: 28 }, lineHeight: 1.5 }}>
          {title}
          <Cursor />
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
          {retro && '// '}
          {description}
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={kind}
          onChange={(_, v: RankingKind | null) => v && navigate(rankingPath(v, season))}
          sx={{ alignSelf: 'flex-start' }}
        >
          <ToggleButton value="sequel" sx={{ px: 2, '&.Mui-selected': { color: 'primary.main' } }}>
            続編希望
          </ToggleButton>
          <ToggleButton value="complete" sx={{ px: 2, '&.Mui-selected': { color: 'secondary.main' } }}>
            キレイに終わった
          </ToggleButton>
        </ToggleButtonGroup>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }} component="nav" aria-label="放送時期">
          {[undefined, ...seasons].map((s) => (
            <Chip
              key={s ?? 'all'}
              component={RouterLink}
              to={rankingPath(kind, s)}
              clickable
              label={s ? seasonLabelFromSlug(s) : '全期間'}
              variant="outlined"
              aria-current={s === season ? 'page' : undefined}
              sx={
                s === season
                  ? { bgcolor: `${accent}.main`, color: `${accent}.contrastText`, borderColor: `${accent}.main`, '&&:hover': { bgcolor: `${accent}.dark` } }
                  : undefined
              }
            />
          ))}
        </Stack>
      </Stack>

      {query.isLoading && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {query.isError && <Alert severity="error">{(query.error as Error).message}</Alert>}

      {data && (
        <Window file={`ranking_${kind}.log`} title="ランキング">
          {data.works.length === 0 ? (
            <Typography color="text.secondary">
              {retro && '> '}まだ投票がありません。下の作品に投票すると、ランキングに載ります。
            </Typography>
          ) : (
            <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {data.works.map((w, i) => (
                <Box
                  component="li"
                  key={w.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '48px minmax(0, 1fr) auto', sm: '64px minmax(0, 1fr) auto' },
                    gap: { xs: 1, sm: 2 },
                    alignItems: 'center',
                    py: 1.5,
                    borderTop: i === 0 ? 0 : 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    sx={{ fontFamily: PIXEL_FONT, fontSize: i < 3 ? { xs: 22, sm: 26 } : 18, color: `${accent}.main`, textAlign: 'center' }}
                  >
                    {i + 1}
                    <Box component="span" sx={{ fontSize: 13 }}>
                      位
                    </Box>
                  </Typography>
                  <Box sx={{ minWidth: 0 }}>
                    <Link
                      component={RouterLink}
                      to={`/works/${w.id}`}
                      color="inherit"
                      sx={{ fontWeight: retro ? 400 : 700, fontSize: { xs: 15, sm: 16 }, wordBreak: 'break-word' }}
                    >
                      {w.title}
                    </Link>
                    <Box sx={{ mt: 0.75, maxWidth: 360 }}>
                      <TallyBar count={w.tally.total} height={8} />
                    </Box>
                  </Box>
                  <Typography sx={{ fontFamily: PIXEL_FONT, color: `${accent}.main`, fontSize: { xs: 16, sm: 18 }, whiteSpace: 'nowrap' }}>
                    {count(w)}票
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Window>
      )}

      {data && data.candidates.length > 0 && (
        <Box>
          <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>
            {retro ? '[まだ票が少ない人気作品]' : 'まだ票が少ない人気作品'}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1.5 }}>
            {retro && '// '}
            {kind === 'sequel' ? '「続編希望」' : '「キレイに終わった」'}の票がまだ無い作品です。あなたの1票でランキングに載ります。
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', alignItems: 'start' }}>
            {data.candidates.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </Box>
        </Box>
      )}

      {season && (
        <Link component={RouterLink} to={`/season/${season}`} color="secondary" sx={{ alignSelf: 'flex-start' }}>
          {retro ? '> ' : ''}
          {seasonLabelFromSlug(season)}のアニメ一覧
        </Link>
      )}
    </Stack>
  )
}
