import CloseIcon from '@mui/icons-material/Close'
import { Box, IconButton, useMediaQuery, type Theme } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { pickCreative, type AdBanner } from '../../lib/adCreatives'
import { afterPageLoad } from '../../lib/afterPageLoad'
import { useMe } from '../../lib/auth'
import { useShowAds } from '../../lib/ads'

/** PCとして扱う幅（lg以上）。それより狭い幅（スマホ・タブレット）はヘッダーの下に横長のバナーを出す */
function useWide() {
  return useMediaQuery((t: Theme) => t.breakpoints.up('lg'), { noSsr: true })
}

/** ページの読み込みが終わってから true（広告の画像で表示の速さの評価を下げないように） */
function useLoaded() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => afterPageLoad(() => setLoaded(true)), [])
  return loaded
}

/** ページを移るたびに、広告の候補から1つをランダムに選ぶ */
function useCreative() {
  const { pathname } = useLocation()
  // pathname は選び直すきっかけとしてだけ使う
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => pickCreative(), [pathname])
}

function Banner({ ad, width, height }: { ad: AdBanner; width: number; height: number }) {
  return (
    <>
      <a href={ad.href} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'block', lineHeight: 0 }}>
        <img src={ad.img} width={width} height={height} alt={ad.alt} style={{ border: 'none', display: 'block' }} />
      </a>
      <img src={ad.pixel} width={1} height={1} alt="" aria-hidden style={{ border: 'none', position: 'absolute' }} />
    </>
  )
}

/**
 * スマホ・タブレット用: ヘッダーの下に出す 320x50 のバナー。
 * ログイン状態の読み込み中も高さだけ確保して、広告が出たときに下の内容がずれないようにする（サポーターだと分かったら消す）。
 */
export function HeaderAd() {
  const wide = useWide()
  const me = useMe()
  const show = useShowAds()
  const loaded = useLoaded()
  const ad = useCreative()
  if (wide || !ad) return null
  if (me !== undefined && !show) return null
  return (
    <Box
      component="aside"
      aria-label="広告"
      sx={{ display: 'flex', justifyContent: 'center', mt: 1, height: 50, overflow: 'hidden', position: 'relative' }}
    >
      {show && loaded && <Banner ad={ad.sp} width={320} height={50} />}
    </Box>
  )
}

/** PC用: 画面の右下に固定して出す 300x250 のバナー。閉じるとサイトを開き直す（再読み込みする）まで出さない */
export function FloatingAd() {
  const wide = useWide()
  const show = useShowAds()
  const loaded = useLoaded()
  const ad = useCreative()
  const [closed, setClosed] = useState(false)
  if (!wide || !show || !loaded || !ad || closed) return null
  return (
    <Box
      component="aside"
      aria-label="広告"
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: (t) => t.zIndex.appBar - 1,
        width: 300,
        bgcolor: 'background.paper',
        boxShadow: 3,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, height: 24, fontSize: 11, color: 'text.secondary' }}>
        広告
        <IconButton size="small" aria-label="広告を閉じる" onClick={() => setClosed(true)} sx={{ p: 0.25, mr: -0.5 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
      <Box sx={{ position: 'relative' }}>
        <Banner ad={ad.pc} width={300} height={250} />
      </Box>
    </Box>
  )
}
