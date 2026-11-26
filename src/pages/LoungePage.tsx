import { Box, Breadcrumbs, Link, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { ThreadSummary } from '../api/client'
import ThreadSection from '../components/bbs/ThreadSection'
import { Prompt } from '../components/Retro'
import { LOUNGE_DESCRIPTION, LOUNGE_LEAD, LOUNGE_TITLE } from '../../edge/seo'
import { takeInitialData, usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'

type ThreadPage = { threads: ThreadSummary[]; total: number; page: number; perPage: number }

/** /lounge 雑談掲示板：作品を問わないトピックの一覧と、トピックを立てるボタン */
export default function LoungePage() {
  usePageMeta({ title: LOUNGE_TITLE, description: LOUNGE_DESCRIPTION })
  const retro = useRetro()
  const qc = useQueryClient()
  // Pages Functions がHTMLに埋め込んだトピック一覧（最新コメント順）を、一覧の取得に使うキャッシュへ入れておく
  useState(() => {
    const initial = takeInitialData<ThreadPage>('fv-initial-lounge', () => true)
    if (initial) qc.setQueryData(['threads', 0, 'active'], initial)
  })

  return (
    <Stack spacing={2.5}>
      <Box>
        <Breadcrumbs sx={{ fontSize: 13, mb: 1 }} aria-label="パンくずリスト">
          <Link component={RouterLink} to="/" color="inherit">
            {retro ? '~' : 'トップ'}
          </Link>
          <Typography sx={{ fontSize: 13 }} color="text.secondary">
            雑談掲示板
          </Typography>
        </Breadcrumbs>
        <Prompt>cd ./lounge</Prompt>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, lineHeight: 1.4 }}>
          雑談掲示板
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
          {retro && '// '}
          {LOUNGE_LEAD}
        </Typography>
      </Box>
      <ThreadSection workId={0} workTitle="" />
    </Stack>
  )
}
