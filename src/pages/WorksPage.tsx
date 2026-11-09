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
import { Fragment } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { TAG_KIND_LABEL, api, type Tag, type WorkSort } from '../api/client'
import { Cursor, Prompt } from '../components/Retro'
import WorkCard from '../components/WorkCard'
import { TOP_HEADING, TOP_LEAD, tagPageDescription, tagPageTitle } from '../../edge/seo'
import { usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'

const SORT_LABEL: Record<WorkSort, string> = {
  recommended: 'おすすめ順',
  new: '新しい順',
  popular: '人気順',
  votes: '投票数順',
  sequel: '続編希望順',
}

export default function WorksPage() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const tagIds = sp.getAll('tag').map(Number).filter(Boolean)
  const sort = (sp.get('sort') as WorkSort) || 'recommended'
  const page = Number(sp.get('page') ?? 1)
  const retro = useRetro()

  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: api.listTags })
  const allTags = tagsQuery.data?.tags ?? []
  const selectedTags = tagIds.map((id) => allTags.find((t) => t.id === id)).filter((t): t is Tag => !!t)

  const worksQuery = useQuery({
    queryKey: ['works', { q, tagIds, sort, page }],
    queryFn: () => api.listWorks({ q, tags: tagIds, sort, page }),
    placeholderData: keepPreviousData,
  })

  const update = (patch: { q?: string; tags?: number[]; sort?: WorkSort; page?: number }) => {
    const next = new URLSearchParams(sp)
    if (patch.q) next.set('q', patch.q)
    else if (patch.q !== undefined) next.delete('q')
    if (patch.tags !== undefined) {
      next.delete('tag')
      patch.tags.forEach((t) => next.append('tag', String(t)))
    }
    if (patch.sort !== undefined) next.set('sort', patch.sort)
    // 条件が変わったら1ページ目に戻す
    if (patch.page !== undefined && patch.page > 1) next.set('page', String(patch.page))
    else next.delete('page')
    setSp(next)
  }

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

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'flex-end' } }}>
      <Box sx={{ flex: 1 }}>
        <Prompt>./vote --sequel-or-complete</Prompt>
        <Typography variant="h5" component="h1" sx={{ fontSize: { xs: 22, md: 28 }, lineHeight: 1.5 }}>
          {/* スマホで「それと／も」のように語の途中で折り返さないよう、句ごとにまとめる */}
          {TOP_HEADING.split(' ').map((phrase, i) => (
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
          {TOP_LEAD}
        </Typography>
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
          aria-label="並び替え"
          sx={{ width: { xs: 128, sm: 160 } }}
          value={sort}
          onChange={(e) => update({ sort: e.target.value as WorkSort })}
        >
          {(Object.keys(SORT_LABEL) as WorkSort[]).map((s) => (
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
      {worksQuery.isLoading && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
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
