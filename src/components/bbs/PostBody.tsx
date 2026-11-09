import { Box, Link, Popover, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { api } from '../../api/client'
import { tokenize } from '../../lib/text'
import PostEmbeds from './PostEmbeds'
import PostImage from './PostImage'
import { PostHeader } from './PostItem'

/**
 * コメント本文。React がエスケープするので HTML はそのまま文字として表示される（XSS対策）。
 * アンカー（>>12）はプレビュー、http(s) のURLだけを外部リンク（nofollow ugc）にする。
 */
export default function PostBody({ threadId, body }: { threadId: number; body: string }) {
  const nodes: ReactNode[] = tokenize(body).map((t, i) => {
    switch (t.type) {
      case 'anchor':
        return <AnchorLink key={i} threadId={threadId} no={t.no} label={t.value} />
      case 'url':
        return (
          <Link key={i} href={t.href} target="_blank" rel="nofollow ugc noopener noreferrer" sx={{ wordBreak: 'break-all' }}>
            {t.value}
          </Link>
        )
      default:
        return t.value
    }
  })

  return (
    <Typography component="div" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.75, fontSize: 15 }}>
      {nodes}
    </Typography>
  )
}

/** >>12 をタップ/クリックすると、そのコメントをポップアップで表示する */
function AnchorLink({ threadId, no, label }: { threadId: number; no: number; label: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['post', threadId, no],
    queryFn: () => api.getPost(threadId, no),
    enabled: !!anchor,
    staleTime: 60_000,
  })
  return (
    <>
      <Link
        component="button"
        type="button"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ verticalAlign: 'baseline', fontSize: 'inherit', fontFamily: 'inherit', color: 'secondary.main' }}
        aria-label={`${no}番のコメントを表示`}
      >
        {label}
      </Link>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2, maxWidth: 'min(560px, calc(100vw - 32px))', maxHeight: '60vh' } } }}
      >
        {isLoading && <Typography variant="body2">読み込み中…</Typography>}
        {isError && <Typography variant="body2">{no}番のコメントは見つかりません</Typography>}
        {data && (
          <Box>
            <PostHeader post={data} />
            <Box sx={{ mt: 1 }}>
              {data.deleted ? (
                <Typography color="text.secondary">このコメントは削除されました</Typography>
              ) : (
                <>
                  {data.body && <PostBody threadId={threadId} body={data.body} />}
                  {data.image && <PostImage image={data.image} alt={`${data.no}番のコメントの画像`} maxHeight={200} />}
                  <PostEmbeds body={data.body} compact />
                </>
              )}
            </Box>
          </Box>
        )}
      </Popover>
    </>
  )
}
