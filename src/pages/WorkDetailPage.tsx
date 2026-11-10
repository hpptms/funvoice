import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Link,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  type Theme,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  CHOICE_LABEL,
  MEDIA_LABEL,
  api,
  getAdminToken,
  type Choice,
  type MyVote,
  type Work,
} from '../api/client'
import ThreadSection from '../components/bbs/ThreadSection'
import AdminMediaEditor from '../components/works/AdminMediaEditor'
import EditHistory from '../components/works/EditHistory'
import RelatedWorks from '../components/works/RelatedWorks'
import ShareButtons from '../components/works/ShareButtons'
import TagEditor from '../components/works/TagEditor'
import WorkMedia from '../components/works/WorkMedia'
import { Prompt, Window } from '../components/Retro'
import VoteTally from '../components/VoteTally'
import {
  rankingPath,
  rankingTitle,
  sequelPhrase,
  sequelQuestion,
  tagPath,
  workPageDescription,
  workPageTitle,
  yearsSinceSeason,
} from '../../edge/seo'
import { takeInitialWork, usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'
import { safeHttpUrl } from '../lib/text'

export default function WorkDetailPage() {
  const id = Number(useParams().id)
  const qc = useQueryClient()
  const key = ['work', id]
  const myVoteKey = ['work', id, 'my-vote']
  const isPhone = useMediaQuery((t: Theme) => t.breakpoints.down('sm'))
  const retro = useRetro()
  const prompt = retro ? '> ' : ''

  // 作品データは誰が見ても同じ（Cloudflareでキャッシュ）。「自分の票」だけ別に取りに行く
  const workQuery = useQuery({
    queryKey: key,
    queryFn: () => api.getWork(id),
    enabled: id > 0,
    initialData: () => takeInitialWork(id),
  })
  const myVoteQuery = useQuery({ queryKey: myVoteKey, queryFn: () => api.getMyVote(id), enabled: id > 0 })
  const myVote = myVoteQuery.data?.myVote ?? null

  const voteMutation = useMutation({
    mutationFn: (choice: Choice | null) => (choice ? api.vote(id, choice) : api.unvote(id)),
    onSuccess: (res) => {
      qc.setQueryData<Work>(key, (old) => old && { ...old, tally: res.tally })
      qc.setQueryData<{ myVote: MyVote | null }>(myVoteKey, { myVote: res.myVote })
      qc.invalidateQueries({ queryKey: ['works'] })
    },
  })

  const w = workQuery.data
  usePageMeta({
    title: w ? workPageTitle(w) : undefined,
    description: w ? workPageDescription(w) : undefined,
    noindex: w ? !w.approved || w.indexable === false : undefined,
  })

  if (workQuery.isLoading)
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  if (workQuery.isError) return <Alert severity="error">{(workQuery.error as Error).message}</Alert>
  const work = workQuery.data
  if (!work) return null

  // 外部から取り込んだURLは http(s) だけをリンクにする（javascript: などによるXSS対策）
  const officialUrl = safeHttpUrl(work.officialSiteUrl)
  const wikipediaUrl = safeHttpUrl(work.wikipediaUrl)
  const seasonTag = work.tags.find((t) => t.kind === 'season')
  const years = yearsSinceSeason(work.seasonName)
  const phrase = sequelPhrase(work.title, work.media)
  const { sequel, complete } = work.tally.total
  const shareText = myVote
    ? `「${work.title}」の${phrase}、私は「${CHOICE_LABEL[myVote.choice]}」に投票しました！ いまの結果は 続編希望${sequel}票・キレイに終わった${complete}票`
    : `「${work.title}」の${phrase}、見たい？ それとも、キレイに終わった？ いまの結果は 続編希望${sequel}票・キレイに終わった${complete}票`
  const isSeason = /^\d{4}-(winter|spring|summer|autumn)$/.test(work.seasonName)

  const voteButton = (choice: Choice, color: 'primary' | 'secondary') => {
    const selected = myVote?.choice === choice
    return (
      <ToggleButton
        value={choice}
        sx={{
          py: { xs: 1.75, sm: 2 },
          fontSize: { xs: 16, sm: 17 },
          whiteSpace: 'nowrap',
          '&.Mui-selected, &.Mui-selected:hover': { bgcolor: `${color}.main`, color: `${color}.contrastText` },
          '&:hover': { color: `${color}.main` },
        }}
      >
        {retro ? `${selected ? '[x]' : '[ ]'} ` : selected ? '✓ ' : ''}
        {CHOICE_LABEL[choice]}
      </ToggleButton>
    )
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Prompt>cat ./works/{work.id}</Prompt>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 32 }, lineHeight: 1.4 }}>
          {work.title}
        </Typography>
        <Typography component="p" sx={{ mt: 0.5, color: 'text.secondary', fontSize: { xs: 14, md: 15 } }}>
          {retro && '// '}
          {sequelQuestion(work.title, work.media)}
        </Typography>
        {work.source === 'user' && (
          <Chip size="small" variant="outlined" label="ユーザーが追加した作品" sx={{ mt: 0.5 }} />
        )}
        <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 1, flexWrap: 'wrap', color: 'text.secondary', fontSize: 13 }}>
          {seasonTag && (
            <Link component={RouterLink} to={tagPath(seasonTag)} color="inherit">
              {retro && 'season: '}
              {seasonTag.name}
              {years !== null && `（放送から約${years}年）`}
            </Link>
          )}
          {work.media && <span>{retro && 'media: '}{MEDIA_LABEL[work.media] ?? work.media}</span>}
          {work.episodesCount > 0 && <span>{retro ? `eps: ${work.episodesCount}` : `全${work.episodesCount}話`}</span>}
          {officialUrl && (
            <Link href={officialUrl} target="_blank" rel="noopener noreferrer" color="secondary">
              公式サイト <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
            </Link>
          )}
          {wikipediaUrl && (
            <Link href={wikipediaUrl} target="_blank" rel="noopener noreferrer" color="secondary">
              Wikipedia <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
            </Link>
          )}
        </Stack>
        {(work.youtubeId || work.imageUrl || work.image) && (
          <Box sx={{ mt: 2 }}>
            <WorkMedia work={work} />
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, alignItems: 'start' }}>
        <Window file="vote.exe" title="あなたの声">
          <ToggleButtonGroup
            exclusive
            fullWidth
            orientation={isPhone ? 'vertical' : 'horizontal'}
            value={myVote?.choice ?? null}
            disabled={voteMutation.isPending || myVoteQuery.isLoading}
            onChange={(_, v: Choice | null) => voteMutation.mutate(v)}
          >
            {voteButton('sequel', 'primary')}
            {voteButton('complete', 'secondary')}
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
            {myVote
              ? `${prompt}「${CHOICE_LABEL[myVote.choice]}」に投票済み（${myVote.registered ? '登録ユーザー票' : '匿名票'}）。もう一度押すと取り消せます。`
              : `${prompt}1作品につき1票。あとから変更・取り消しもできます。`}
          </Typography>
          {voteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(voteMutation.error as Error).message}
            </Alert>
          )}
        </Window>

        <Window file="stats.log" title={`「${work.title}」${phrase}希望の声`}>
          <VoteTally tally={work.tally} />
          {work.seasonRank && isSeason && (
            <Typography sx={{ mt: 1.5, fontSize: 13 }}>
              {retro && '> '}
              <Link component={RouterLink} to={rankingPath('sequel', work.seasonName)} color="primary">
                {rankingTitle('sequel', work.seasonName)}
              </Link>
              ：{work.seasonRank.rank}位（{work.seasonRank.total}作品中）
            </Typography>
          )}
        </Window>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
          {retro ? '> ' : ''}みんなにも聞いてみる（票の割合のカード画像付きで共有されます）
        </Typography>
        <ShareButtons url={`${window.location.origin}/works/${work.id}`} text={shareText} />
      </Box>

      {((work.staff?.length ?? 0) > 0 || (work.series?.length ?? 0) > 0) && (
        <Window file="data.txt" title="作品データ">
          {(work.staff?.length ?? 0) > 0 && (
            <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px minmax(0, 1fr)' }, columnGap: 2, rowGap: 0.5 }}>
              {groupStaff(work.staff ?? []).map(([role, names]) => (
                <Box key={role} sx={{ display: 'contents' }}>
                  <Box component="dt" sx={{ color: 'text.secondary', fontSize: 13, mt: { xs: 0.75, sm: 0 } }}>
                    {role}
                  </Box>
                  <Box component="dd" sx={{ m: 0 }}>
                    {names.join('、')}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
          {work.series?.map((g) => (
            <Box key={g.name} sx={{ mt: (work.staff?.length ?? 0) > 0 ? 2.5 : 0 }}>
              <Typography variant="subtitle2" component="h2" sx={{ mb: 0.5 }}>
                {retro ? `[シリーズ: ${g.name}]` : `「${g.name}」シリーズ`}
              </Typography>
              <RelatedWorks works={g.works} currentId={work.id} showSeason />
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
            スタッフ・シリーズの情報：
            <Link href="https://annict.com/" target="_blank" rel="noopener noreferrer" color="inherit">
              Annict
            </Link>
          </Typography>
        </Window>
      )}

      <Window file="tags.txt" title="タグ">
        <TagEditor work={work} />
        <EditHistory workId={work.id} />
      </Window>

      <ThreadSection workId={work.id} workTitle={work.title} />
      {(work.seasonWorks?.length ?? 0) > 0 && seasonTag && (
        <Window file="season.txt" title={`同じ${seasonTag.name}のアニメ`}>
          <RelatedWorks works={work.seasonWorks ?? []} />
          <Link component={RouterLink} to={tagPath(seasonTag)} color="secondary" sx={{ display: 'inline-block', mt: 1.5, fontSize: 14 }}>
            {retro ? '> ' : ''}
            {seasonTag.name}のアニメをもっと見る
          </Link>
        </Window>
      )}
      {getAdminToken() && <AdminWorkControls work={work} />}
    </Stack>
  )
}

/** 管理者用: 承認（検索エンジンに載せる）・ロック・削除 */
function AdminWorkControls({ work }: { work: Work }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const update = useMutation({
    mutationFn: (patch: { approved?: boolean; locked?: boolean; removeMedia?: boolean }) => api.admin.updateWork(work.id, patch),
    // 管理APIの返す作品にはシリーズ等の追加情報が無いので、今の表示に重ねる
    onSuccess: (w) => qc.setQueryData<Work>(['work', work.id], (old) => (old ? { ...old, ...w } : w)),
  })
  const del = useMutation({
    mutationFn: () => api.admin.deleteWork(work.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['works'] })
      navigate('/')
    },
  })
  return (
    <Window file="sudo" title="管理者メニュー">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button variant={work.approved ? 'outlined' : 'contained'} disabled={update.isPending} onClick={() => update.mutate({ approved: !work.approved })}>
          {work.approved ? '承認を取り消す（検索エンジンから外す）' : '承認する（検索エンジンに載せる）'}
        </Button>
        <Button variant="outlined" disabled={update.isPending} onClick={() => update.mutate({ locked: !work.locked })}>
          {work.locked ? 'タグ編集のロックを解除' : 'タグ編集をロック'}
        </Button>
        <Button
          color="error"
          variant="outlined"
          disabled={del.isPending}
          onClick={() => confirm(`「${work.title}」を削除しますか？投票・掲示板もすべて消えます。`) && del.mutate()}
        >
          作品を削除
        </Button>
      </Stack>
      {(update.isError || del.isError) && <Alert severity="error" sx={{ mt: 1 }}>{((update.error ?? del.error) as Error).message}</Alert>}
      <Divider sx={{ my: 2 }} />
      {/* key: 別の作品に移ったら入力欄を作り直す */}
      <AdminMediaEditor key={work.id} work={work} />
    </Window>
  )
}

/** 役職ごとに名前をまとめる（API は役職の順に並んでいる） */
function groupStaff(staff: { role: string; name: string }[]): [string, string[]][] {
  const out: [string, string[]][] = []
  for (const s of staff) {
    const last = out[out.length - 1]
    if (last && last[0] === s.role) last[1].push(s.name)
    else out.push([s.role, [s.name]])
  }
  return out
}
