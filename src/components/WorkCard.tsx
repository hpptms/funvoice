import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { MEDIA_LABEL, type Work } from '../api/client'
import { isOnAir } from '../lib/season'
import { useRetro } from '../lib/styleMode'
import { PIXEL_FONT } from '../theme'
import { TitleBar } from './Retro'
import WorkCardMedia from './works/WorkCardMedia'
import { TallyBar } from './VoteTally'

export default function WorkCard({ work }: { work: Work }) {
  const retro = useRetro()
  const { sequel, complete } = work.tally.total
  const votes = sequel + complete
  const season = work.tags.find((t) => t.kind === 'season')?.name
  const media = work.media ? (MEDIA_LABEL[work.media] ?? work.media) : ''
  // 今期（日本時間の日付から自動判定）の作品
  const onAir = isOnAir(work.seasonName)

  return (
    <Card
      sx={{
        transition: 'transform .12s, box-shadow .12s',
        '&:hover': retro
          ? { transform: 'translate(-2px, -2px)', boxShadow: (t) => `6px 6px 0 ${t.vars!.palette.primary.main}` }
          : { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.10)' },
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={`/works/${work.id}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {retro && (
          <TitleBar>
            {/* 長いと末尾が省略されるので、放送中は先頭に出す */}
            {onAir && (
              <Box component="span" sx={{ bgcolor: 'error.main', color: '#fff', px: 0.5, py: 0.25, mr: 0.75 }}>
                放送中
              </Box>
            )}
            #{String(work.id).padStart(4, '0')}
            {season && ` ${season}`}
            {media && ` / ${media}`}
          </TitleBar>
        )}
        <WorkCardMedia work={work} />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
          {!retro && (season || media || onAir) && (
            <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
              {onAir && <Chip label="放送中" size="small" sx={{ fontWeight: 700, bgcolor: 'error.main', color: '#fff' }} />}
              {season && <Chip label={season} size="small" />}
              {media && <Chip label={media} size="small" variant="outlined" />}
            </Stack>
          )}
          <Typography
            component="h2"
            sx={
              retro
                ? { fontFamily: PIXEL_FONT, fontSize: 17, lineHeight: 1.45 }
                : { fontWeight: 700, fontSize: 16, lineHeight: 1.5 }
            }
          >
            {work.title}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, fontSize: 12, color: 'text.secondary' }}>
            {work.tags
              .filter((t) => t.kind !== 'season')
              .slice(0, 4)
              .map((t) => (
                <span key={t.id}>#{t.name}</span>
              ))}
          </Box>
          <div>
            <TallyBar count={work.tally.total} />
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
              {votes === 0 ? (
                retro ? '> no votes yet' : 'まだ投票がありません'
              ) : (
                <>
                  <Box component="span" sx={{ color: 'primary.main' }}>
                    {retro ? '続編' : '続編希望'} {sequel}
                  </Box>
                  {' / '}
                  <Box component="span" sx={{ color: 'secondary.main' }}>
                    {retro ? '完結' : 'キレイに終わった'} {complete}
                  </Box>
                </>
              )}
            </Typography>
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
