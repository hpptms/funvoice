import CodeIcon from '@mui/icons-material/Code'
import { Box, Button, TextField, Typography } from '@mui/material'
import { useState } from 'react'

/** ブログ・感想サイトに貼る「続編希望 〇票［投票する］」のカード（iframe）と、作品ページへのリンクのHTML */
function embedSnippet(origin: string, work: { id: number; title: string }): string {
  const title = work.title.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
  return (
    `<iframe src="${origin}/embed/works/${work.id}" title="「${title}」続編希望の投票（FanVoice）" ` +
    `width="100%" height="150" style="border:0;max-width:480px" loading="lazy"></iframe>\n` +
    `<p><a href="${origin}/works/${work.id}">「${title}」の続編希望の声・投票（FanVoice）</a></p>`
  )
}

export default function EmbedCode({ work }: { work: { id: number; title: string } }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const code = embedSnippet(window.location.origin, work)
  return (
    <Box>
      <Button size="small" color="inherit" startIcon={<CodeIcon />} onClick={() => setOpen((v) => !v)} aria-expanded={open} sx={{ minHeight: 36 }}>
        ブログに貼る
      </Button>
      {open && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
            このHTMLをブログや感想サイトに貼ると、票の数と「投票する」ボタンのカードが表示されます。
          </Typography>
          <TextField
            value={code}
            multiline
            fullWidth
            minRows={3}
            slotProps={{ htmlInput: { readOnly: true, style: { fontFamily: 'monospace', fontSize: 12 } } }}
            onFocus={(e) => e.target.select()}
          />
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
            onClick={() =>
              navigator.clipboard
                ?.writeText(code)
                .then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                })
                .catch(() => undefined)
            }
          >
            {copied ? 'コピーしました' : 'コードをコピー'}
          </Button>
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              プレビュー
            </Typography>
            <Box
              component="iframe"
              src={`/embed/works/${work.id}`}
              title="埋め込みのプレビュー"
              loading="lazy"
              sx={{ display: 'block', width: '100%', maxWidth: 480, height: 150, border: 0 }}
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}
