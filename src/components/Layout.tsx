import { AppBar, Box, Button, Container, Link, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useRetro } from '../lib/styleMode'
import { PIXEL_FONT } from '../theme'
import BackButton from './BackButton'
import StyleSwitch from './StyleSwitch'

const FOOTER_LINKS = [
  ['/about', 'サイトについて'],
  ['/terms', '利用規約'],
  ['/privacy', 'プライバシーポリシー'],
  ['/copyright', '著作権・削除依頼'],
  ['/contact', 'お問い合わせ'],
] as const

export default function Layout() {
  const retro = useRetro()
  const isTop = useLocation().pathname === '/'

  const navSx = {
    color: 'inherit',
    fontSize: { xs: 14, sm: 15 },
    px: { xs: 0.75, sm: 1 },
    minWidth: 0,
    height: 40,
    whiteSpace: 'nowrap',
    '&.active': retro ? { color: 'success.main' } : { color: 'primary.main' },
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
            FanVoice
            {retro && (
              <Box component="span" sx={{ fontSize: 11, ml: 0.75, opacity: 0.7, display: { xs: 'none', sm: 'inline' } }}>
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
          <Box sx={{ flex: 1 }} />
          <StyleSwitch />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3, pt: isTop ? 3 : 1.5, flex: 1 }}>
        {/* トップ以外のページには、左上に控えめな「戻る」ボタンを出す */}
        {!isTop && <BackButton />}
        <Outlet />
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
