import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import { Button } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRetro } from '../lib/styleMode'

/**
 * ページ左上の控えめな「戻る」ボタン（トップ以外のページに表示）。
 * サイト内から来た場合はブラウザの「戻る」と同じ動き。検索エンジンや共有リンクから直接開いた場合は、
 * サイトの外へ出てしまわないようトップへ移動する。
 */
export default function BackButton() {
  const retro = useRetro()
  const navigate = useNavigate()
  const location = useLocation()
  // react-router は最初に開いたページの location.key を 'default' にする（＝サイト内の履歴が無い）
  const hasHistory = location.key !== 'default'

  return (
    <Button
      size="small"
      onClick={() => (hasHistory ? navigate(-1) : navigate('/'))}
      aria-label={hasHistory ? '前のページに戻る' : 'トップへ戻る'}
      startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: '0.9em !important' }} />}
      sx={{
        ml: -1,
        mb: 1,
        px: 1,
        minHeight: 36,
        color: 'text.secondary',
        fontWeight: retro ? 400 : 700,
        fontSize: 13,
        '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
      }}
    >
      {hasHistory ? '戻る' : 'トップへ'}
    </Button>
  )
}
