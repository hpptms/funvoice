import CloseIcon from '@mui/icons-material/Close'
import { Box, Card, IconButton, useMediaQuery, type Theme } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { pickCreative, type AdBanner } from '../../lib/adCreatives'
import { afterPageLoad } from '../../lib/afterPageLoad'
import { useShowAds } from '../../lib/ads'
import { useRetro } from '../../lib/styleMode'
import { TitleBar } from '../Retro'

/** PCとして扱う幅（lg以上）。それより狭い幅（スマホ・タブレット）は画面の一番下に横長のバナーを出す */
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

/** iPhone のホームバーなどに重ならないよう、画面下の安全領域の分も空ける */
const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)'

/**
 * スマホ・タブレット用: 画面の一番下に固定して出す 320x50 のバナー。
 * ページの末尾（フッター）が広告に隠れないよう、同じ高さの余白もページの最後に入れる。
 */
export function BottomAd() {
  const wide = useWide()
  const show = useShowAds()
  const loaded = useLoaded()
  const ad = useCreative()
  const retro = useRetro()
  if (wide || !show || !loaded || !ad) return null
  return (
    <>
      <Box aria-hidden sx={{ height: `calc(50px + ${SAFE_BOTTOM})` }} />
      <Box
        component="aside"
        aria-label="広告"
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar - 1,
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          // レトロはカードと同じ太い黒線で区切る
          borderTop: retro ? 2 : 1,
          borderColor: 'divider',
          pb: SAFE_BOTTOM,
        }}
      >
        <Box sx={{ position: 'relative', height: 50, overflow: 'hidden' }}>
          <Banner ad={ad.sp} width={320} height={50} />
        </Box>
      </Box>
    </>
  )
}

/** PC用: 画面の右下に固定して出す 300x250 のバナー。閉じるとサイトを開き直す（再読み込みする）まで出さない */
export function FloatingAd() {
  const wide = useWide()
  const show = useShowAds()
  const loaded = useLoaded()
  const ad = useCreative()
  const [closed, setClosed] = useState(false)
  const retro = useRetro()
  if (!wide || !show || !loaded || !ad || closed) return null
  // レトロ: 作品カードと同じ、タイトルバー付きのウィンドウ（黒い太枠＋ハード影。× で閉じる）
  if (retro)
    return (
      <Card
        component="aside"
        aria-label="広告"
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: (t) => t.zIndex.appBar - 1,
          width: 'auto',
          borderRadius: 0,
        }}
      >
        <TitleBar onClose={() => setClosed(true)} closeLabel="広告を閉じる">
          <Box component="span" sx={{ bgcolor: 'primary.main', color: '#fff', px: 0.5, py: 0.25, mr: 0.75 }}>
            広告
          </Box>
          sponsor.exe
        </TitleBar>
        <Box sx={{ position: 'relative', lineHeight: 0 }}>
          <Banner ad={ad.pc} width={300} height={250} />
        </Box>
      </Card>
    )
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
