import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import { AppBar, Box, Button, Container, Link, Toolbar, Typography } from '@mui/material'
import { Suspense } from 'react'
import { Link as RouterLink, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useRetro } from '../lib/styleMode'
import { PIXEL_FONT } from '../theme'
import { useMe } from '../lib/auth'
import UserIcon from './account/UserIcon'
import BackButton from './BackButton'
import StyleSwitch from './StyleSwitch'

const FOOTER_LINKS = [
  ['/about', 'サイトについて'],
  ['/help', '使い方'],
  ['/faq', 'よくある質問'],
  ['/terms', '利用規約'],
  ['/privacy', 'プライバシーポリシー'],
  ['/copyright', '著作権・削除依頼'],
  ['/contact', 'お問い合わせ'],
] as const

/**
 * レトロモードの黒いヘッダー上の緑。テーマの success（紙色の背景用の濃い緑）だと黒地とのコントラスト比が 3.4 しかなく
 * 読みにくいので、ヘッダーでは明るい緑にする（#141414 に対して約 10:1）
 */
const RETRO_HEADER_GREEN = '#5fd38a'

export default function Layout() {
  const retro = useRetro()
  const { pathname } = useLocation()
  const isTop = pathname === '/'
  // ランキングは「続編希望／キレイに終わった」「時期」でURLが変わるので、どれを開いていてもナビを選択中にする
  const isRanking = pathname.startsWith('/ranking')
  const me = useMe()

  const navSx = {
    color: 'inherit',
    fontSize: { xs: 14, sm: 15 },
    px: { xs: 0.75, sm: 1 },
    minWidth: 0,
    height: 40,
    whiteSpace: 'nowrap',
    '&.active': retro ? { color: RETRO_HEADER_GREEN } : { color: 'primary.main' },
  } as const

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={
          retro
            ? { bgcolor: 'divider', color: 'background.paper', borderBottom: 2, borderColor: 'divider' }
            : { bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }
        }
      >
        <Toolbar sx={{ gap: { xs: 0.25, sm: 0.5 }, minHeight: { xs: 56 }, px: { xs: 1.5, sm: 3 } }}>
          <Typography
            component={RouterLink}
            to="/"
            // スマホではサイト名の文字を隠してロゴ画像だけになるため、読み上げ用の名前を付けておく
            aria-label="FanVoice トップへ"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: retro ? PIXEL_FONT : undefined,
              fontWeight: retro ? 400 : 800,
              fontSize: { xs: 18, sm: 20 },
              color: 'inherit',
              textDecoration: 'none',
              mr: { xs: 0.5, sm: 2 },
              whiteSpace: 'nowrap',
            }}
          >
            <Box
              component="img"
              src="/logo-64.png"
              alt=""
              width={32}
              height={32}
              sx={{
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
                mr: 0.75,
                verticalAlign: 'middle',
                borderRadius: retro ? 0 : '50%',
                // ドット絵なので、レトロモードでは拡大・縮小時にぼかさない
                imageRendering: retro ? 'pixelated' : 'auto',
                ...(retro ? { outline: 2, outlineColor: 'primary.main' } : {}),
              }}
            />
            {/* スマホ（〜479px）ではロゴ画像だけにして、ヘッダーのボタン（作品・タグ・ランキング）を1行に収める */}
            {/* サイト名はブラウザの自動翻訳で訳させない */}
            <Box component="span" translate="no" sx={{ '@media (max-width: 479.95px)': { display: 'none' } }}>
              FanVoice
            </Box>
            {retro && (
              <Box component="span" sx={{ fontSize: 11, ml: 0.75, opacity: 0.7, display: { xs: 'none', md: 'inline' } }}>
                v0.1-alpha
              </Box>
            )}
          </Typography>
          <Button component={NavLink} to="/" end sx={navSx}>
            <NavLabel retro={retro}>作品</NavLabel>
          </Button>
          <Button component={NavLink} to="/tags" sx={navSx}>
            <NavLabel retro={retro}>タグ</NavLabel>
          </Button>
          <Button component={NavLink} to="/ranking/sequel" sx={navSx} className={isRanking ? 'active' : undefined}>
            <NavLabel retro={retro}>ランキング</NavLabel>
          </Button>
          <Box sx={{ flex: 1 }} />
          {/* 読み込み中（undefined）は何も出さず、ログイン状態が分かってから表示する（ちらつき防止） */}
          {me ? (
            <Button component={NavLink} to="/mypage" sx={{ ...navSx, gap: 0.75, maxWidth: { xs: 44, sm: 200 } }} aria-label="マイページ">
              {me.iconUrl ? (
                <UserIcon url={me.iconUrl} size={26} />
              ) : (
                <Box component="span" sx={{ display: { sm: 'none' } }}>
                  <NavLabel retro={retro}>マイ</NavLabel>
                </Box>
              )}
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {me.name}
              </Box>
            </Button>
          ) : (
            me === null && (
              <>
                <Button component={NavLink} to="/login" sx={{ ...navSx, minWidth: { xs: 36, sm: 0 } }} aria-label="ログイン">
                  {/* スマホ幅は横幅が足りないのでアイコンだけ */}
                  <AccountCircleOutlinedIcon sx={{ display: { sm: 'none' } }} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    <NavLabel retro={retro}>ログイン</NavLabel>
                  </Box>
                </Button>
                {/* ユーザー登録は目立たせる（スマホ幅は「登録」だけ） */}
                <Button
                  component={NavLink}
                  to="/register"
                  variant="outlined"
                  color={retro ? 'success' : 'primary'}
                  aria-label="ユーザー登録"
                  sx={{
                    ...navSx,
                    color: retro ? RETRO_HEADER_GREEN : 'primary.main',
                    borderColor: retro ? RETRO_HEADER_GREEN : undefined,
                    height: { xs: 32, sm: 34 },
                    px: { xs: 0.75, sm: 1.25 },
                    mr: { xs: 0.5, sm: 1 },
                    fontSize: { xs: 13, sm: 14 },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                    ユーザー
                  </Box>
                  登録
                </Button>
              </>
            )
          )}
          <StyleSwitch />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3, pt: isTop ? 3 : 1.5, flex: 1 }}>
        {/* トップ以外のページには、左上に控えめな「戻る」ボタンを出す */}
        {!isTop && <BackButton />}
        {/* 遅延読み込みのページへ移動したとき、読み込み中もヘッダー・フッターは表示したままにする */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </Container>

      <Box component="footer" sx={{ borderTop: retro ? 2 : 1, borderColor: 'divider', bgcolor: 'background.paper', py: 2 }}>
        <Container
          maxWidth="lg"
          sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: 'text.secondary' }}
        >
          <Box sx={{ flexBasis: '100%' }}>
            {retro
              ? '/* 1クールで終わったあの作品の「続編希望」の声を、数字にして届ける。 */'
              : '1クールで終わったあの作品の「続編希望」の声を、数字にして届ける。'}
          </Box>
          <Box component="nav" aria-label="サイト情報" sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, flex: 1 }}>
            {FOOTER_LINKS.map(([to, label]) => (
              <Link key={to} component={RouterLink} to={to} color="inherit" sx={{ py: 0.75 }}>
                {label}
              </Link>
            ))}
          </Box>
          <Link component={RouterLink} to="/admin" color="inherit" sx={{ py: 0.75 }}>
            {retro ? 'sudo' : '管理'}
          </Link>
        </Container>
      </Box>
    </Box>
  )
}

/** レトロモードでは [作品] のように括弧で囲む。スマホ幅は横幅が足りないので括弧なし */
function NavLabel({ retro, children }: { retro: boolean; children: string }) {
  if (!retro) return children
  return (
    <>
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>[</Box>
      {children}
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>]</Box>
    </>
  )
}
