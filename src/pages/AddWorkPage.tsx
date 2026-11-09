import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  ApiError,
  MEDIA_LABEL,
  TAG_KIND_LABEL,
  api,
  type NewWorkInput,
  type Tag,
} from '../api/client'
import { Prompt } from '../components/Retro'
import MediaPicker from '../components/works/MediaPicker'
import SeasonSelect from '../components/works/SeasonSelect'
import { isMediaValid, type MediaChoice } from '../lib/media'
import { EMPTY_SEASON, toSeasonInput, type SeasonValue } from '../lib/season'
import { usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'
import { safeHttpUrl } from '../lib/text'

/** 入力が落ち着いてから値を返す（入力のたびに検索APIを呼ばないため） */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Annict に無い作品を、利用者が追加するページ */
export default function AddWorkPage() {
  usePageMeta({ title: '作品を追加', noindex: true })
  const retro = useRetro()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [titleKana, setTitleKana] = useState('')
  const [media, setMedia] = useState('tv')
  const [seasonValue, setSeasonValue] = useState<SeasonValue>(EMPTY_SEASON)
  const [episodes, setEpisodes] = useState('')
  const [officialUrl, setOfficialUrl] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [mediaChoice, setMediaChoice] = useState<MediaChoice>({ kind: 'none' })

  // 似た名前の作品が既にないか（重複登録の防止）
  const q = useDebounced(title.trim(), 400)
  const similar = useQuery({
    queryKey: ['works', { q, similar: true }],
    queryFn: () => api.listWorks({ q }),
    enabled: [...q].length >= 2,
  })
  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: api.listTags })

  const mutation = useMutation({
    mutationFn: () => {
      const input: NewWorkInput = {
        title,
        titleKana,
        media,
        officialSiteUrl: officialUrl.trim(),
        tagIds: tags.map((t) => t.id),
        ...(toSeasonInput(seasonValue) ?? {}),
        ...(episodes ? { episodesCount: Number(episodes) } : {}),
        ...(mediaChoice.kind === 'youtube' && mediaChoice.url.trim() ? { youtubeUrl: mediaChoice.url.trim() } : {}),
        ...(mediaChoice.kind === 'image' && mediaChoice.url.trim() ? { imageUrl: mediaChoice.url.trim() } : {}),
      }
      return api.createWork(input)
    },
    onSuccess: (work) => navigate(`/works/${work.id}`),
  })
  const existingId = mutation.error instanceof ApiError ? (mutation.error.data.existingId as number | undefined) : undefined

  const urlInvalid = officialUrl.trim() !== '' && !safeHttpUrl(officialUrl)
  const canSubmit = title.trim() !== '' && !urlInvalid && isMediaValid(mediaChoice) && !mutation.isPending

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Prompt>touch ./works/new</Prompt>
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, mb: 1 }}>
        作品を追加
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2, fontSize: 14 }}>
        {retro && '// '}
        一覧に無いアニメを追加できます。追加した作品は、運営が確認するまで検索エンジンには表示されません。
      </Typography>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            spacing={2.5}
            component="form"
            onSubmit={(e) => {
              e.preventDefault()
              if (canSubmit) mutation.mutate()
            }}
          >
            <Box>
              <TextField
                label="作品名"
                required
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 100 } }}
                helperText="正式なタイトルを入力してください"
              />
              {similar.data && similar.data.works.length > 0 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  もしかして、すでに登録されていませんか？
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {similar.data.works.slice(0, 5).map((w) => (
                      <li key={w.id}>
                        <Link component={RouterLink} to={`/works/${w.id}`}>
                          {w.title}
                        </Link>
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}
            </Box>
            <TextField
              label="読みがな（任意）"
              value={titleKana}
              onChange={(e) => setTitleKana(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
              <TextField select label="媒体" value={media} onChange={(e) => setMedia(e.target.value)}>
                {Object.entries(MEDIA_LABEL).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="話数（任意）"
                type="number"
                value={episodes}
                onChange={(e) => setEpisodes(e.target.value)}
                slotProps={{ htmlInput: { min: 0, max: 3000, inputMode: 'numeric' } }}
              />
            </Box>
            <Box>
              <SeasonSelect value={seasonValue} onChange={setSeasonValue} />
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5, mx: 1.5 }}>
                放送時期タグが自動で付きます。季節が分からない・1クールではない場合は「未選択」、時期が分からない場合は「不明」
              </Typography>
            </Box>

            <TextField
              label="公式サイトのURL（任意）"
              type="url"
              value={officialUrl}
              onChange={(e) => setOfficialUrl(e.target.value)}
              error={urlInvalid}
              helperText={urlInvalid ? 'http:// または https:// で始まるURLを入力してください' : ' '}
              slotProps={{ htmlInput: { maxLength: 500, inputMode: 'url' } }}
            />

            <MediaPicker value={mediaChoice} onChange={setMediaChoice} />

            <Autocomplete
              multiple
              options={(tagsQuery.data?.tags ?? []).filter((t) => t.kind !== 'season')}
              groupBy={(t) => TAG_KIND_LABEL[t.kind]}
              getOptionLabel={(t) => t.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={tags}
              onChange={(_, v) => setTags(v.slice(0, 10))}
              renderInput={(params) => (
                <TextField {...params} label="タグ（任意・10個まで）" helperText="新しいタグは、追加したあと作品ページで作れます" />
              )}
            />

            {mutation.isError && (
              <Alert severity="error">
                {(mutation.error as Error).message}
                {existingId && (
                  <>
                    {' '}
                    <Link component={RouterLink} to={`/works/${existingId}`}>
                      その作品のページへ
                    </Link>
                  </>
                )}
              </Alert>
            )}
            <Button type="submit" variant="contained" size="large" disabled={!canSubmit} sx={{ alignSelf: { sm: 'flex-start' }, minWidth: 180, height: 48 }}>
              {mutation.isPending ? '追加中…' : '作品を追加する'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
