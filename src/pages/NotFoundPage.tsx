import { Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { usePageMeta } from '../lib/pageMeta'

export default function NotFoundPage() {
  usePageMeta({ title: 'ページが見つかりません', noindex: true })
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
      <Typography variant="h5">
        ページが見つかりません
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        トップへ
      </Button>
    </Stack>
  )
}
