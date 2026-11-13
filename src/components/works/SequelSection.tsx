import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { api, type MyPrediction, type PredictionCounts, type Work } from '../../api/client'
import { useMe } from '../../lib/auth'
import { formatDateTime } from '../../lib/format'
import { useRetro } from '../../lib/styleMode'
import { isPast, sequelAnswer, sequelPhrase } from '../../../edge/seo'
import { Window } from '../Retro'
import RelatedWorks from './RelatedWorks'

/**
 * 作品ページの「〇〇の2期（続編）はある？」。
 * 続編の状況（シリーズの後の作品・記録した発表）と、続編予想（1年以内に発表されるか）
 */
export default function SequelSection({ work }: { work: Work }) {
  const retro = useRetro()
  const st = work.sequel
  const phrase = sequelPhrase(work.title, work.media)
  return (
    <Window file="sequel.txt" title={`「${work.title}」の${phrase}はある？`}>
      <Typography sx={{ overflowWrap: 'anywhere' }}>
        {retro && '> '}
        {sequelAnswer(work, st)}
      </Typography>
      {st && st.works.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <RelatedWorks works={st.works} showSeason />
        </Box>
      )}
      {st?.checkedAt && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
          {formatDateTime(st.checkedAt, false).slice(0, 10)}時点の情報（シリーズの情報：
          <Link href="https://annict.com/" target="_blank" rel="noopener noreferrer" color="inherit">
            Annict
          </Link>
          ）
        </Typography>
      )}
      {work.predictions && (work.predictions.open || work.predictions.yes + work.predictions.no > 0) && (
        <PredictionBox workId={work.id} counts={work.predictions} />
      )}
    </Window>
  )
}

function PredictionBox({ workId, counts }: { workId: number; counts: PredictionCounts }) {
  const me = useMe()
  const qc = useQueryClient()
  const { pathname } = useLocation()
  const key = ['work', workId, 'my-prediction']
  const mine = useQuery({ queryKey: key, queryFn: () => api.getMyPrediction(workId), enabled: !!me })
  const my = mine.data?.prediction ?? null
  const predict = useMutation({
    mutationFn: (will: boolean) => api.predict(workId, will),
    onSuccess: (res) => {
      qc.setQueryData<{ prediction: MyPrediction | null }>(key, { prediction: res.prediction })
      qc.setQueryData<Work>(['work', workId], (old) => old && { ...old, predictions: res.counts })
      qc.invalidateQueries({ queryKey: ['me', 'predictions'] })
    },
  })
  const total = counts.yes + counts.no
  const locked = !!my && isPast(my.changeableUntil)
  const canPredict = counts.open && !!me && !locked && !my?.result

  return (
    <Box sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      <Typography sx={{ fontWeight: 700 }}>続編予想：1年以内に続編が発表されると思う？</Typography>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
        {total > 0 ? `発表される ${counts.yes}人 / 発表されない ${counts.no}人` : 'まだ予想はありません'}
        {counts.open ? '。「発表される」を当てるとマイページにバッジが付きます' : '（受付終了）'}
      </Typography>
      {counts.open && me === null && (
        <Typography variant="body2">
          <Link component={RouterLink} to="/login" state={{ from: pathname }}>
            ログイン
          </Link>
          すると予想できます。
        </Typography>
      )}
      {me && (counts.open || my) && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {[true, false].map((will) => {
            const selected = my?.willAnnounce === will
            return (
              <Button
                key={String(will)}
                variant={selected ? 'contained' : 'outlined'}
                color={will ? 'primary' : 'inherit'}
                disabled={!canPredict || predict.isPending || mine.isLoading || selected}
                onClick={() => predict.mutate(will)}
                sx={{ minHeight: 44, minWidth: 140 }}
              >
                {selected ? '✓ ' : ''}
                {will ? '発表される' : '発表されない'}
              </Button>
            )
          })}
        </Stack>
      )}
      {my && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
          {my.result === 'hit'
            ? '的中しました！'
            : my.result === 'miss'
              ? 'はずれでした'
              : locked
                ? `予想は確定しました。締め切りは${formatDateTime(my.deadline, false).slice(0, 10)}です`
                : `${formatDateTime(my.changeableUntil, false)}まで変更できます。締め切りは${formatDateTime(my.deadline, false).slice(0, 10)}`}
        </Typography>
      )}
      {predict.isError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {(predict.error as Error).message}
        </Alert>
      )}
    </Box>
  )
}
