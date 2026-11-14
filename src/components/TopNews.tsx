import { Box, Card, CardContent, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { NEWS, newsDateLabel } from '../../edge/news'
import { useRetro } from '../lib/styleMode'

/** トップに出す最新のお知らせの件数 */
const ROWS = 3

/** トップの一番下に出す「お知らせ」。本文は edge/news.ts（通信なし・最初から同じ高さで出るのでずれない） */
export default function TopNews() {
  const retro = useRetro()
  return (
    <Card component="section" aria-labelledby="top-news-heading">
      <CardContent sx={{ px: { xs: 2, sm: 3 }, py: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
          <Typography id="top-news-heading" variant="h6" component="h2" sx={{ fontSize: 16, flex: 1 }}>
            {retro ? '## お知らせ' : 'お知らせ'}
          </Typography>
          <Link component={RouterLink} to="/news" sx={{ fontSize: 13 }}>
            一覧を見る
          </Link>
        </Box>
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {NEWS.slice(0, ROWS).map((n) => (
            <Box
              component="li"
              key={`${n.date}-${n.title}`}
              sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, columnGap: 2, py: 0.75, fontSize: 14 }}
            >
              <Box component="time" dateTime={n.date} sx={{ color: 'text.secondary', flexShrink: 0, fontSize: 13 }}>
                {newsDateLabel(n.date)}
              </Box>
              <Box component="span">{n.title}</Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
