import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import IosShareIcon from '@mui/icons-material/IosShare'
import XIcon from '@mui/icons-material/X'
import { Button, Stack } from '@mui/material'
import { useState } from 'react'

/**
 * X に投稿する・端末の共有メニュー（スマホ）・リンクをコピー。
 * URL を貼るとカード画像（作品名と票の割合。/api/og/works/:id.png）が表示される。
 * 外部のスクリプト（X のウィジェット等）は読み込まず、投稿画面へのリンクを開くだけにする。
 */
export default function ShareButtons({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const intent = `https://x.com/intent/post?${new URLSearchParams({ text, url })}`

  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <Button
        variant="contained"
        size="small"
        startIcon={<XIcon />}
        href={intent}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ bgcolor: '#141414', color: '#fff', '&:hover': { bgcolor: '#333' } }}
      >
        ポスト
      </Button>
      {canShare ? (
        <Button
          variant="outlined"
          size="small"
          startIcon={<IosShareIcon />}
          onClick={() => navigator.share({ text, url }).catch(() => undefined)}
        >
          共有
        </Button>
      ) : (
        <Button
          variant="outlined"
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={() =>
            navigator.clipboard
              ?.writeText(url)
              .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              })
              .catch(() => undefined)
          }
        >
          {copied ? 'コピーしました' : 'リンクをコピー'}
        </Button>
      )}
    </Stack>
  )
}
