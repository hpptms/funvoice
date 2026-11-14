import { Box, ButtonBase, Link, Popover, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { splitSpoilers } from '../../../edge/spoiler'
import { api } from '../../api/client'
import { useRetro } from '../../lib/styleMode'
import { tokenize } from '../../lib/text'
import PostEmbeds from './PostEmbeds'
import PostImage from './PostImage'
import { PostHeader } from './PostItem'

/**
 * コメント本文。React がエスケープするので HTML はそのまま文字として表示される（XSS対策）。
 * アンカー（>>12）はプレビュー、http(s) のURLだけを外部リンク（nofollow ugc）にする。
 */
export default function PostBody({ threadId, body }: { threadId: number; body: string }) {
  const segments = splitSpoilers(body)
  return (
    <Typography component="div" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.75, fontSize: 15 }}>
      {segments.map((seg, i) =>
        seg.spoiler ? (
          <Spoiler key={i} threadId={threadId} text={seg.text} />
        ) : (
          // ネタバレ枠はブロック表示なので、枠の前後の改行1つは詰める（空行が出ないように）
          <span key={i}>{renderInline(threadId, trimAround(seg.text, segments[i - 1]?.spoiler, segments[i + 1]?.spoiler))}</span>
        ),
      )}
    </Typography>
  )
}

function trimAround(text: string, afterSpoiler?: boolean, beforeSpoiler?: boolean): string {
  let t = text
  if (afterSpoiler) t = t.replace(/^[ 　]*\r?\n/, '')
  if (beforeSpoiler) t = t.replace(/\r?\n[ 　]*$/, '')
  return t
}

function renderInline(threadId: number, body: string): ReactNode[] {
  return tokenize(body).map((t, i) => {
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
}

/**
 * 「#ネタバレ 〜 #」で囲まれた部分。最初は中身を描画せず（DOMにも出さない）、
 * 押したときに初めて本文と画像・動画のプレビューを表示する。
 */
function Spoiler({ threadId, text }: { threadId: number; text: string }) {
  const retro = useRetro()
  const [open, setOpen] = useState(false)
  return (
    <Box component="span" sx={{ display: 'block', my: 0.75 }}>
      <ButtonBase
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        sx={{
          px: 1.5,
          minHeight: 40,
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'inherit',
          color: 'warning.main',
          border: 1,
          borderColor: 'warning.main',
          borderRadius: retro ? 0 : 1.5,
          bgcolor: (t) => `color-mix(in srgb, ${t.vars!.palette.warning.main} 10%, transparent)`,
        }}
      >
        {open ? '▲ ネタバレを隠す' : '#ネタバレの可能性あり！（タップで表示）'}
      </ButtonBase>
      {open && (
        <Box
          component="span"
          sx={{ display: 'block', mt: 0.75, pl: 1.5, borderLeft: 3, borderColor: 'warning.main' }}
        >
          {renderInline(threadId, text)}
          <PostEmbeds body={text} compact />
        </Box>
      )}
    </Box>
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
