import { Box, Button, Chip, CircularProgress, Collapse, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api, type Post, type Reaction } from '../../api/client'
import { isPopular } from '../../lib/bbs'
import { formatDateTime } from '../../lib/format'
import { useRetro } from '../../lib/styleMode'
import { PIXEL_FONT } from '../../theme'
import UserIcon from '../account/UserIcon'
import PostBody from './PostBody'
import PostEmbeds from './PostEmbeds'
import PostImage from './PostImage'
import ReactionButtons from './ReactionButtons'
import ReportDialog from './ReportDialog'

/**
 * コメント見出し。
 * レトロ: 「12 名前：匿名 [主] 2026/11/09(月) 17:20:01 ID:aB3dE9xQ」（2ch風）
 * シンプル: 「12. 匿名 主 · 2026/11/09(月) 17:20 · ID:aB3dE9xQ」
 */
export function PostHeader({ post }: { post: Post }) {
  const retro = useRetro()
  const owner = post.isOwner && (
    <Chip
      label="主"
      size="small"
      color="primary"
      sx={{
        height: 20,
        fontSize: 11,
        fontWeight: 700,
        // レトロのテーマはチップの背景を紙色にするので、ここでは明示的に塗る
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        border: 0,
        ...(retro ? { fontFamily: PIXEL_FONT } : {}),
      }}
    />
  )
  return (
    <Stack
      direction="row"
      useFlexGap
      sx={{ flexWrap: 'wrap', alignItems: 'center', columnGap: 1, rowGap: 0.25, fontSize: 13, color: 'text.secondary' }}
    >
      <Box component="span" sx={{ fontWeight: 700, color: 'text.primary', fontFamily: retro ? PIXEL_FONT : undefined }}>
        {retro ? post.no : `${post.no}.`}
      </Box>
      {!post.deleted && (
        <>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            {/* ログイン中に書かれたコメントだけ、「名前：匿名」の左にアイコンを出す */}
            <UserIcon url={post.iconUrl} />
            {retro && '名前：'}
            <Box component="span" sx={{ color: retro ? 'success.main' : 'text.primary', fontWeight: retro ? 400 : 700 }}>
              {post.name}
            </Box>
          </Box>
          {owner}
        </>
      )}
      <Box component="time" dateTime={post.createdAt}>
        {formatDateTime(post.createdAt, retro)}
      </Box>
      {!post.deleted && <Box component="span">ID:{post.anonId}</Box>}
    </Stack>
  )
}

export default function PostItem({
  threadId,
  post,
  myReaction,
  isOwnPost,
  onReact,
  reacting,
  onReply,
  onReported,
  onAdminDelete,
}: {
  threadId: number
  post: Post
  myReaction: Reaction | null
  isOwnPost: boolean
  onReact: (post: Post, value: Reaction | null) => void
  reacting?: boolean
  onReply?: (no: number) => void
  onReported?: () => void
  onAdminDelete?: (post: Post) => void
}) {
  const retro = useRetro()
  const [showReplies, setShowReplies] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const popular = isPopular(post)

  const replies = useQuery({
    queryKey: ['replies', threadId, post.no],
    queryFn: () => api.listPosts(threadId, { replyTo: post.no }),
    enabled: showReplies,
  })

  const linkBtn = { minWidth: 0, px: { xs: 0.75, sm: 1 }, height: 36, fontSize: 13, color: 'text.secondary', whiteSpace: 'nowrap' } as const

  return (
    <Box
      id={`p${post.no}`}
      component="article"
      sx={{
        scrollMarginTop: 72,
        py: 2,
        px: { xs: 1.5, sm: 2 },
        borderBottom: 1,
        borderColor: 'divider',
        ...(popular &&
          (retro
            ? { borderLeft: 4, borderLeftColor: 'primary.main', pl: { xs: 1, sm: 1.5 } }
            : { bgcolor: (t) => `color-mix(in srgb, ${t.vars!.palette.primary.main} 6%, transparent)` })),
        '&:target': { bgcolor: (t) => `color-mix(in srgb, ${t.vars!.palette.secondary.main} 10%, transparent)` },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PostHeader post={post} />
        </Box>
        {popular && (
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {retro ? '★HOT' : '人気'}
          </Typography>
        )}
      </Stack>

      <Box sx={{ mt: 1, ...(popular && !retro ? { fontSize: 16 } : {}) }}>
        {post.deleted ? (
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
            このコメントは削除されました
          </Typography>
        ) : (
          <>
            {post.body && <PostBody threadId={threadId} body={post.body} />}
            {/* 以前の添付画像（画像の添付は終了。過去のコメントの表示のためだけに残す） */}
            {post.image && <PostImage image={post.image} alt={`${post.no}番のコメントの画像`} />}
            <PostEmbeds body={post.body} />
          </>
        )}
      </Box>

      {!post.deleted && (
        <Stack direction="row" useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap', alignItems: 'center', columnGap: { xs: 0, sm: 0.5 }, rowGap: 0.5 }}>
          <ReactionButtons
            plus={post.plus}
            minus={post.minus}
            mine={myReaction}
            isOwnPost={isOwnPost}
            disabled={reacting}
            onChange={(v) => onReact(post, v)}
          />
          <Box sx={{ flex: 1 }} />
          {onReply && (
            <Button size="small" sx={linkBtn} onClick={() => onReply(post.no)}>
              <Bracket on={retro}>返信</Bracket>
            </Button>
          )}
          {post.replyCount > 0 && (
            <Button size="small" sx={{ ...linkBtn, color: 'secondary.main' }} onClick={() => setShowReplies((v) => !v)}>
              <Bracket on={retro}>{`${post.replyCount}件の返信`}</Bracket>
              {showReplies ? ' ▲' : ' ▼'}
            </Button>
          )}
          <Button size="small" sx={linkBtn} onClick={() => setReportOpen(true)}>
            <Bracket on={retro}>通報</Bracket>
          </Button>
          {onAdminDelete && (
            <Button size="small" color="error" sx={{ ...linkBtn, color: 'error.main' }} onClick={() => onAdminDelete(post)}>
              削除
            </Button>
          )}
        </Stack>
      )}

      {post.replyCount > 0 && (
        <Collapse in={showReplies} unmountOnExit>
          <Box sx={{ mt: 1, ml: { xs: 1, sm: 3 }, pl: { xs: 1, sm: 2 }, borderLeft: 2, borderColor: 'divider' }}>
            {replies.isLoading && <CircularProgress size={20} sx={{ m: 1 }} />}
            {replies.data?.posts.map((r) => (
              <Box key={r.id} sx={{ py: 1.25, '& + &': { borderTop: 1, borderColor: 'divider' } }}>
                <PostHeader post={r} />
                <Box sx={{ mt: 0.5 }}>
                  {r.deleted ? (
                    <Typography color="text.secondary">このコメントは削除されました</Typography>
                  ) : (
                    <>
                      {r.body && <PostBody threadId={threadId} body={r.body} />}
                      {r.image && <PostImage image={r.image} alt={`${r.no}番のコメントの画像`} maxHeight={200} />}
                      <PostEmbeds body={r.body} compact />
                    </>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  ＋{r.plus} ／ －{r.minus}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      )}

      <ReportDialog
        postId={post.id}
        no={post.no}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onDone={() => onReported?.()}
      />
    </Box>
  )
}

/** レトロモードでは [返信] のように括弧で囲む。スマホ幅は1行に収めるため括弧なし */
function Bracket({ on, children }: { on: boolean; children: string }) {
  if (!on) return children
  return (
    <>
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>[</Box>
      {children}
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>]</Box>
    </>
  )
}
