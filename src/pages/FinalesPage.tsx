import { Alert, Box, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { api, type FinaleWork } from '../api/client'
import { Prompt, RankingBanner, Window } from '../components/Retro'
import WorkCard from '../components/WorkCard'
import {
  FINALES_DESCRIPTION,
  FINALES_TITLE,
  broadcastTimeLabel,
  currentSeasonName,
  daysSinceJst,
  rankingPath,
  rankingTitle,
} from '../../edge/seo'
import { takeInitialData, usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'

type Finales = { ended: FinaleWork[]; upcoming: FinaleWork[] }

/** /finales 今週最終回を迎えた作品・まもなく最終回の作品（最終回の直後に投票してもらう） */
export default function FinalesPage() {
  usePageMeta({ title: FINALES_TITLE, description: FINALES_DESCRIPTION })
  const retro = useRetro()
  const [initial] = useState(() => takeInitialData<Finales>('fv-initial-finales', () => true))
  const q = useQuery({ queryKey: ['finales'], queryFn: api.getFinales, initialData: initial })
  const season = currentSeasonName()

  return (
    <Stack spacing={3}>
      <Box>
        <Prompt>ls ./finales --this-week</Prompt>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, lineHeight: 1.4 }}>
          今週最終回のアニメ
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
          {retro && '// '}
          見終わったら「続編希望」か「キレイに終わった」かを投票しよう。最終回直後の声がいちばん大事なデータになります。
        </Typography>
        <Box sx={{ mt: 2 }}>
          <RankingBanner to={rankingPath('sequel', season)} color="primary">
            {rankingTitle('sequel', season)}
          </RankingBanner>
        </Box>
      </Box>

      {q.isLoading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />}
      {q.isError && <Alert severity="error">{(q.error as Error).message}</Alert>}
      {q.data && (
        <>
          <Window file="ended.log" title="最終回を迎えた作品（直近10日）">
            <FinaleGrid works={q.data.ended} empty="この10日間に最終回を迎えた作品はありません。" />
          </Window>
          <Window file="upcoming.log" title="まもなく最終回（7日以内）">
            <FinaleGrid works={q.data.upcoming} empty="7日以内に最終回を迎える作品はありません。" />
          </Window>
          <Typography variant="caption" color="text.secondary">
            最終回の日時は
            <Link href="https://annict.com/" target="_blank" rel="noopener noreferrer" color="inherit">
              Annict
            </Link>
            の放送予定から求めた目安です（最初に放送する局の最後の放送日時）。放送の変更で前後することがあります。
          </Typography>
          <Link component={RouterLink} to="/sequels" color="secondary" sx={{ alignSelf: 'flex-start' }}>
            {retro ? '> ' : ''}続編決定アニメ一覧
          </Link>
        </>
      )}
    </Stack>
  )
}

function FinaleGrid({ works, empty }: { works: FinaleWork[]; empty: string }) {
  if (works.length === 0) return <Typography color="text.secondary">{empty}</Typography>
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', alignItems: 'start' }}>
      {works.map((w) => {
        const days = daysSinceJst(w.lastBroadcastAt)
        const when = days === 0 ? '今日' : days > 0 ? `${days}日前` : days === -1 ? '明日' : `${-days}日後`
        return (
          <Box key={w.id}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 700, color: days >= 0 ? 'primary.main' : 'text.secondary' }}>
              最終回 {broadcastTimeLabel(w.lastBroadcastAt)}（{when}）
            </Typography>
            <WorkCard work={w} />
          </Box>
        )
      })}
    </Box>
  )
}
