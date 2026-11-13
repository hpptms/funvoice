import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import CelebrationIcon from '@mui/icons-material/Celebration'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Navigate, Link as RouterLink } from 'react-router-dom'
import { api, type Notification } from '../api/client'
import EmptyNote from '../components/mypage/EmptyNote'
import Pager from '../components/mypage/Pager'
import { Prompt } from '../components/Retro'
import { useMe } from '../lib/auth'
import { formatRelative } from '../lib/format'
import { UNREAD_KEY } from '../lib/notifications'
import { usePageMeta } from '../lib/pageMeta'
import { seasonNameLabel } from '../lib/season'

/** 通知の一覧（返信・続編決定）。開いたら既読にする */
export default function NotificationsPage() {
  usePageMeta({ title: '通知', noindex: true })
  const me = useMe()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const q = useQuery({
    queryKey: ['me', 'notifications', page],
    queryFn: () => api.me.notifications(page),
    enabled: !!me,
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
  const hasUnread = !!q.data?.notifications.some((n) => !n.read)
  useEffect(() => {
    if (!hasUnread) return
    api.me
      .markRead({ all: true })
      .then(() => qc.setQueryData(UNREAD_KEY, 0))
      .catch(() => undefined)
  }, [hasUnread, qc])

  if (me === undefined) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 6 }} />
  if (me === null) return <Navigate to="/login" replace />

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Prompt>tail -f ./notifications</Prompt>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 } }}>
          通知
        </Typography>
        <Button component={RouterLink} to="/mypage?tab=notify" size="small" sx={{ height: 40 }}>
          通知の設定
        </Button>
      </Stack>
      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {q.isLoading ? (
            <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
          ) : q.isError ? (
            <Alert severity="error">{(q.error as Error).message}</Alert>
          ) : q.data!.notifications.length === 0 ? (
            <EmptyNote>
              まだ通知はありません。ログイン中に書いたコメントへの返信や、続編希望に投票した作品の続編決定をお知らせします。
            </EmptyNote>
          ) : (
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {q.data!.notifications.map((n) => (
                <NotificationRow key={n.id} n={n} />
              ))}
            </Box>
          )}
          {q.data && <Pager total={q.data.total} perPage={q.data.perPage} page={page} onChange={setPage} />}
        </CardContent>
      </Card>
    </Box>
  )
}

function NotificationRow({ n }: { n: Notification }) {
  const isReply = n.kind === 'reply'
  const season = n.sequelSeasonName ? seasonNameLabel(n.sequelSeasonName) : null
  return (
    <Box
      component="li"
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        '&:first-of-type': { borderTop: 0 },
        bgcolor: n.read ? undefined : 'action.hover',
      }}
    >
      <Link
        component={RouterLink}
        to={n.url}
        color="inherit"
        underline="none"
        sx={{ display: 'flex', gap: 1.5, p: 1.5, minHeight: 56, '&:hover .title': { textDecoration: 'underline' } }}
      >
        <Box sx={{ pt: 0.25, color: isReply ? 'secondary.main' : 'primary.main', flexShrink: 0 }}>
          {isReply ? <ChatBubbleOutlineIcon aria-hidden /> : <CelebrationIcon aria-hidden />}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography className="title" sx={{ fontWeight: n.read ? 400 : 700, overflowWrap: 'anywhere' }}>
            {isReply
              ? `「${n.threadTitle}」のあなたのコメント（${n.postNo}番）に返信がありました`
              : `続編決定！「${n.workTitle}」${n.sequelWorkTitle ? `の続編「${n.sequelWorkTitle}」${season ? `（${season}）` : ''}` : 'の続編'}が発表されました`}
          </Typography>
          {isReply && n.excerpt && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
              {n.replyNo}. {n.excerpt}
            </Typography>
          )}
          {!isReply && n.note && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {n.note}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {formatRelative(n.createdAt)}
            {isReply && n.workTitle && `・${n.workTitle}`}
          </Typography>
        </Box>
      </Link>
    </Box>
  )
}
