import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Fragment, useEffect, useState } from 'react'
import { Link as RouterLink, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { TAG_KIND_LABEL, api, type Tag, type WorkList, type WorkSort } from '../api/client'
import { Cursor, Prompt, RankingBanner } from '../components/Retro'
import WorkCard from '../components/WorkCard'
import {
  TOP_HEADING,
  TOP_LEAD,
  isSeasonName,
  rankingPath,
  rankingTitle,
  seasonLabelFromSlug,
  tagPageDescription,
  tagPageTitle,
  tagPath,
} from '../../edge/seo'
import NotFoundPage from './NotFoundPage'
import { takeInitialData, usePageMeta } from '../lib/pageMeta'
import { currentSeasonName, seasonNameLabel } from '../lib/season'
import { useRetro } from '../lib/styleMode'

/** 並び替え欄の選択肢。onair = 今期（日本時間の日付から自動判定）の作品だけをおすすめ順で出す */
type ListSort = WorkSort | 'onair'

const SORT_LABEL: Record<ListSort, string> = {
  recommended: 'おすすめ順',
  onair: '放送中',
  new: '新しい順',
  popular: '人気順',
  votes: '投票数順',
  sequel: '続編希望順',
}

/**
 * 作品一覧。トップ（/）と、タグ別のページ（/season/2026-autumn・/tags/123。baseTagId にそのタグ）で使う。
 * タグ1つだけの一覧はタグ別のページのURLにし、検索語や2つ目以降のタグがあるときはトップに ?q=&tag= を付ける。
 */
export default function WorksPage({ baseTagId }: { baseTagId?: number }) {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const q = sp.get('q') ?? ''
  const queryTagIds = sp.getAll('tag').map(Number).filter(Boolean)
  const tagIds = baseTagId ? [baseTagId, ...queryTagIds.filter((id) => id !== baseTagId)] : queryTagIds
  const sort = (sp.get('sort') as ListSort) || 'recommended'
  const page = Number(sp.get('page') ?? 1)
  const retro = useRetro()

  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: api.listTags })
  const allTags = tagsQuery.data?.tags ?? []
  const selectedTags = tagIds.map((id) => allTags.find((t) => t.id === id)).filter((t): t is Tag => !!t)
  // 「放送中」は今期の放送時期タグで絞り込む（季節が変わると自動で次の時期のタグになる）
  const onAir = sort === 'onair'
  const onAirLabel = seasonNameLabel(currentSeasonName())
  const onAirTag = onAir ? allTags.find((t) => t.kind === 'season' && t.name === onAirLabel) : undefined
  const queryTags = onAirTag && !tagIds.includes(onAirTag.id) ? [...tagIds, onAirTag.id] : tagIds
  const apiSort: WorkSort = onAir ? 'recommended' : sort

  // Pages Functions がHTMLに埋め込んだ一覧（条件なし、またはタグ1つだけの1ページ目）。最初の1回だけ読む
  const isDefaultList = !q && page === 1 && sort === 'recommended' && tagIds.length <= 1
  const [initial] = useState(() =>
    takeInitialData<{ tag: number | null; list: WorkList }>(
      'fv-initial-works',
      (d) => isDefaultList && (d.tag === null ? tagIds.length === 0 : tagIds[0] === d.tag),
    ),
  )
  const fromInitial = !!initial && isDefaultList && (initial.tag === null ? tagIds.length === 0 : tagIds[0] === initial.tag)

  const worksQuery = useQuery({
    queryKey: ['works', { q, tagIds: queryTags, sort: apiSort, page }],
    queryFn: () => api.listWorks({ q, tags: queryTags, sort: apiSort, page }),
    // 放送中は、タグの一覧を読んで今期のタグが分かってから取りに行く
    enabled: !onAir || !!onAirTag,
    placeholderData: keepPreviousData,
    initialData: fromInitial ? initial.list : undefined,
  })

  const update = (patch: { q?: string; tags?: number[]; sort?: ListSort; page?: number }) => {
    const nextQ = patch.q ?? q
    const nextTags = patch.tags ?? tagIds
    const nextSort = patch.sort ?? sort
    const next = new URLSearchParams()
    if (nextQ) next.set('q', nextQ)
    // タグ1つだけ（検索語なし）ならタグ別のページへ。タグの一覧がまだ読めていなければトップの ?tag= のまま
    const single = !nextQ && nextTags.length === 1 ? allTags.find((t) => t.id === nextTags[0]) : undefined
    if (!single) nextTags.forEach((t) => next.append('tag', String(t)))
    if (nextSort !== 'recommended') next.set('sort', nextSort)
    // 条件が変わったら1ページ目に戻す
    if (patch.page !== undefined && patch.page > 1) next.set('page', String(patch.page))
    const qs = next.toString()
    navigate(`${single ? tagPath(single) : '/'}${qs ? `?${qs}` : ''}`)
  }

  // 以前のURL（/?tag=123）や、アプリ内の古いリンクから来たら、タグ別のページへ置き換える
  const legacySingle = !baseTagId && !q && queryTagIds.length === 1 ? allTags.find((t) => t.id === queryTagIds[0]) : undefined
  useEffect(() => {
    if (!legacySingle) return
    const next = new URLSearchParams(sp)
    next.delete('tag')
    const qs = next.toString()
    navigate(`${tagPath(legacySingle)}${qs ? `?${qs}` : ''}`, { replace: true })
  }, [legacySingle, sp, navigate])
  const data = worksQuery.data
  // タグ1つだけの一覧は「タグ別のアニメ一覧ページ」として検索に出す（functions/index.ts と同じ文言）
  const singleTag = !q && selectedTags.length === 1 ? selectedTags[0] : undefined
  usePageMeta({
    title: q
      ? `「${q}」の検索結果`
      : singleTag
        ? tagPageTitle(singleTag.name)
        : selectedTags.length
          ? selectedTags.map((t) => t.name).join(' × ')
          : undefined,
    description: singleTag ? tagPageDescription(singleTag.name, data?.total) : undefined,
  })
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1
  // 放送時期のページ（/season/2026-autumn）なら、その時期のランキングへのリンクを出す
  const pageTag = baseTagId ? allTags.find((t) => t.id === baseTagId) : undefined
  const season = pageTag ? tagPath(pageTag).replace(/^\/season\//, '') : ''

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'flex-end' } }}>
      <Box sx={{ flex: 1 }}>
        <Prompt>{pageTag ? `ls ./tags/${pageTag.name}` : './vote --sequel-or-complete'}</Prompt>
        <Typography variant="h5" component="h1" sx={{ fontSize: { xs: 22, md: 28 }, lineHeight: 1.5 }}>
          {/* スマホで「それと／も」のように語の途中で折り返さないよう、句ごとにまとめる */}
          {(pageTag ? tagPageTitle(pageTag.name).split('｜')[0] : TOP_HEADING).split(' ').map((phrase, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              <Box component="span" sx={{ display: 'inline-block' }}>
                {phrase}
              </Box>
            </Fragment>
          ))}
          <Cursor />
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
          {retro && '// '}
          {pageTag ? tagPageDescription(pageTag.name, data?.total) : TOP_LEAD}
        </Typography>
        {(isSeasonName(season) || !baseTagId) && (
          <Stack direction="row" useFlexGap sx={{ mt: 2, mb: 0.5, gap: 2, flexWrap: 'wrap' }}>
            {(['sequel', 'complete'] as const).map((kind) => (
              <RankingBanner
                key={kind}
                to={rankingPath(kind, isSeasonName(season) ? season : undefined)}
                color={kind === 'sequel' ? 'primary' : 'secondary'}
              >
                {rankingTitle(kind, isSeasonName(season) ? season : undefined)}
              </RankingBanner>
            ))}
          </Stack>
        )}
      </Box>
      <Button component={RouterLink} to="/works/new" variant="outlined" startIcon={<AddIcon />} sx={{ height: 44, flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
        作品を追加
      </Button>
      </Stack>

      {/* スマホ・タブレット: 検索 / タグ＋並び替え の2段、PC: 1段 */}
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, md: 2 },
          gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: 'minmax(0, 1fr) minmax(0, 1.4fr) auto' },
          '& > form': { gridColumn: { xs: '1 / -1', md: 'auto' } },
        }}
      >
        {/* key={q} で、URLの検索語が変わったら入力欄を作り直して同期する */}
        <SearchBox key={q} initial={q} onSearch={(v) => update({ q: v })} />
        <Autocomplete
          multiple
          size="small"
          sx={{ minWidth: 0 }}
          options={allTags}
          groupBy={(t) => TAG_KIND_LABEL[t.kind]}
          getOptionLabel={(t) => t.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          value={selectedTags}
          loading={tagsQuery.isLoading}
          onChange={(_, v) => update({ tags: v.map((t) => t.id) })}
          renderOption={(props, t) => {
            const { key, ...rest } = props
            return (
              <li key={key} {...rest}>
                <Box sx={{ flex: 1 }}>{t.name}</Box>
                <Typography variant="caption" color="text.secondary">
                  {t.workCount}
                </Typography>
              </li>
            )
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder={selectedTags.length ? '' : 'タグで絞り込み'} />
          )}
        />
        <TextField
          select
          size="small"
          sx={{ width: { xs: 128, sm: 160 } }}
          // 名前は選択欄（role=combobox の要素）に付ける。外側の div に付けると ARIA の誤用になる
          slotProps={{ htmlInput: { 'aria-label': '並び替え' } }}
          value={sort}
          onChange={(e) => update({ sort: e.target.value as ListSort })}
        >
          {(Object.keys(SORT_LABEL) as ListSort[]).map((s) => (
            <MenuItem key={s} value={s}>
              {SORT_LABEL[s]}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {(q || selectedTags.length > 0) && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {q && <Chip label={`「${q}」`} onDelete={() => update({ q: '' })} />}
          {selectedTags.map((t) => (
            <Chip
              key={t.id}
              label={t.name}
              color="primary"
              variant="outlined"
              onDelete={() => update({ tags: tagIds.filter((id) => id !== t.id) })}
            />
          ))}
          {data && (
            <Typography variant="body2" color="text.secondary">
              {retro ? `=> ${data.total} hits` : `${data.total}件`}
            </Typography>
          )}
        </Stack>
      )}

      {worksQuery.isError && <Alert severity="error">{(worksQuery.error as Error).message}</Alert>}
      {(worksQuery.isLoading || (onAir && tagsQuery.isLoading)) && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {onAir && !tagsQuery.isLoading && !onAirTag && (
        <Alert severity="info">{onAirLabel}の作品はまだ登録されていません。</Alert>
      )}

      {data && data.works.length === 0 && (
        <Alert
          severity="info"
          action={
            <Button component={RouterLink} to="/works/new" color="inherit" size="small">
              作品を追加
            </Button>
          }
        >
          該当する作品がありません。見つからない作品は追加できます。
        </Alert>
      )}

      {data && data.works.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            // 画像付きのカードに合わせて画像なしのカードが縦に伸び、中に空白ができないよう、高さは揃えない
            alignItems: 'start',
            opacity: worksQuery.isPlaceholderData ? 0.6 : 1,
          }}
        >
          {data.works.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </Box>
      )}

      {pageCount > 1 && (
        <Pagination
          sx={{ alignSelf: 'center' }}
          count={pageCount}
          page={page}
          onChange={(_, p) => {
            update({ page: p })
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </Stack>
  )
}

function SearchBox({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(String(new FormData(e.currentTarget).get('q') ?? '').trim())
      }}
    >
      <TextField
        fullWidth
        size="small"
        name="q"
        placeholder="作品名で検索"
        defaultValue={initial}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  )
}

/** /season/2026-autumn：URLの放送時期からタグを探して一覧を出す */
export function SeasonWorksPage() {
  const slug = useParams().slug ?? ''
  const label = seasonLabelFromSlug(slug)
  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: api.listTags })
  // タグの一覧を待たずに出せるよう、Pages Functions が埋め込んだ初期データのタグIDを先に使う
  const [initialTagId] = useState(peekInitialWorksTag)
  const tag = tagsQuery.data?.tags.find((t) => t.kind === 'season' && t.name === label)
  const id = tag?.id ?? (tagsQuery.data ? undefined : initialTagId)
  if (!label || (tagsQuery.data && !tag)) return <NotFoundPage />
  if (!id) return <Loading />
  return <WorksPage key={id} baseTagId={id} />
}

/** /tags/123：タグ別の一覧。放送時期タグなら /season/… に置き換える */
export function TagWorksPage() {
  const id = Number(useParams().id)
  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: api.listTags })
  const tag = tagsQuery.data?.tags.find((t) => t.id === id)
  if (!(id > 0) || (tagsQuery.data && !tag)) return <NotFoundPage />
  if (tag && tagPath(tag) !== `/tags/${id}`) return <Navigate to={tagPath(tag)} replace />
  return <WorksPage key={id} baseTagId={id} />
}

function Loading() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  )
}

/** 埋め込まれた初期データ（fv-initial-works）のタグIDを、消さずに読む（一覧の本体は WorksPage が読む） */
function peekInitialWorksTag(): number | undefined {
  try {
    const data = JSON.parse(document.getElementById('fv-initial-works')?.textContent ?? 'null') as { tag: number | null } | null
    return data?.tag ?? undefined
  } catch {
    return undefined
  }
}
