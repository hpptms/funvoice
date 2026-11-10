import { Alert, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { Prompt } from '../components/Retro'
import { TAG_KIND_LABEL, api, type TagKind } from '../api/client'
import { TAGS_PAGE_DESCRIPTION, TAGS_PAGE_TITLE, tagPath } from '../../edge/seo'
import { usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'

const KINDS: TagKind[] = ['season', 'source', 'genre', 'other']

export default function TagsPage() {
  usePageMeta({ title: TAGS_PAGE_TITLE, description: TAGS_PAGE_DESCRIPTION })
  const retro = useRetro()
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['tags'], queryFn: api.listTags })

  if (isLoading)
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  if (isError) return <Alert severity="error">{(error as Error).message}</Alert>

  const tags = data?.tags ?? []
  return (
    <Stack spacing={4}>
      <Box>
        <Prompt>ls ./tags</Prompt>
        <Typography variant="h5" component="h1">
          {TAGS_PAGE_TITLE}
        </Typography>
      </Box>
      {KINDS.map((kind) => {
        const list = tags.filter((t) => t.kind === kind)
        if (list.length === 0) return null
        return (
          <Box key={kind}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              {retro ? `[${TAG_KIND_LABEL[kind]}]` : TAG_KIND_LABEL[kind]}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {list.map((t) => (
                <Chip
                  key={t.id}
                  component={RouterLink}
                  to={tagPath(t)}
                  clickable
                  label={`#${t.name} (${t.workCount ?? 0})`}
                  variant={t.workCount ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Box>
        )
      })}
    </Stack>
  )
}
