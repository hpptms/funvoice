import { Box } from '@mui/material'
import { useState } from 'react'
import { useRetro } from '../../lib/styleMode'

/**
 * 登録ユーザーのアイコン（外部の画像URLを元のサイトから直接表示）。
 * Referer は送らない。読み込めなければ何も表示しない。
 */
export default function UserIcon({ url, size = 20 }: { url?: string; size?: number }) {
  const retro = useRetro()
  // 読み込みに失敗したURL（URLが変われば改めて表示を試す）
  const [failedUrl, setFailedUrl] = useState<string>()
  if (!url || failedUrl === url) return null
  return (
    <Box
      component="img"
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedUrl(url)}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        objectFit: 'cover',
        verticalAlign: 'middle',
        borderRadius: retro ? 0 : '50%',
        bgcolor: 'action.hover',
        ...(retro ? { outline: 1, outlineColor: 'divider' } : {}),
      }}
    />
  )
}
