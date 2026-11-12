import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { STATIC_PAGES } from '../../edge/content'
import { api, type Post } from '../api/client'
import { PostHeader } from '../components/bbs/PostItem'
import { Prompt } from '../components/Retro'
import { useMe } from '../lib/auth'
import { formatPrice, goToStripe, SUPPORTER_PERKS } from '../lib/billing'
import { usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'
import { StaticSections } from './StaticPage'

const page = STATIC_PAGES.supporter

/** バッジの見え方の例（掲示板のコメントの見出しと同じ部品で描く） */
const SAMPLE_POST: Post = {
  id: 0,
  no: 12,
  name: '匿名',
  anonId: 'aB3dE9xQ',
  isOwner: false,
  body: '',
  deleted: false,
  plus: 0,
  minus: 0,
  replyCount: 0,
  createdAt: '2026-11-13T21:00:00+09:00',
  premium: true,
}

/**
 * サポーター（サブスクリプション）の案内ページ。
 * 未ログインなら登録・ログインへ、ログイン中ならその場で Stripe の決済ページへ進める。
 * 本文（申し込み方法・解約）は edge/content.ts と共通で、検索エンジン向けのHTMLにも同じものを出す。
 */
export default function SupporterPage() {
  usePageMeta({ title: page.title, description: page.description })
  const retro = useRetro()
  const me = useMe()
  const plan = useQuery({ queryKey: ['billing-plan'], queryFn: api.billing.plan, staleTime: 10 * 60_000 })
  const checkout = useMutation({ mutationFn: async () => goToStripe((await api.billing.checkout()).url) })

  const closed = plan.isError || (plan.data && !plan.data.enabled)

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      <Prompt>cat ./supporter.md</Prompt>
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, mb: 1 }}>
        {page.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
        個人で運営しているFanVoiceを、月額のサブスクリプションで応援できます。投票・掲示板などの機能はこれまでどおりすべて無料です。
      </Typography>

      <Card sx={{ mb: 2, borderTop: retro ? undefined : 4, borderColor: 'primary.main' }}>
        <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2.5, sm: 3.5 } }}>
          <Typography variant="h6" component="h2" sx={{ fontSize: 18, mb: 1.5 }}>
            {retro ? '## 特典' : '特典'}
          </Typography>
          <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0, mb: 2 }}>
            {SUPPORTER_PERKS.map((perk) => (
              <Stack component="li" key={perk} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <CheckCircleRoundedIcon color="primary" sx={{ fontSize: 20, mt: '3px', flexShrink: 0 }} />
                <Typography sx={{ lineHeight: 1.7 }}>{perk}</Typography>
              </Stack>
            ))}
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
            コメントでの表示例
          </Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: retro ? 0 : 2, px: 1.5, py: 1, mb: 3, bgcolor: 'background.default' }}>
            <PostHeader post={SAMPLE_POST} />
          </Box>

          <Box sx={{ textAlign: { sm: 'center' } }}>
            {plan.data?.price && (
              <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, mb: 0.5 }}>
                {formatPrice(plan.data.price)}
                <Box component="span" sx={{ fontSize: 14, fontWeight: 400, ml: 0.5 }}>
                  （税込）
                </Box>
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              いつでも解約できます。お支払いは Stripe の決済ページで行います。
            </Typography>
            {renderAction()}
            {checkout.isError && (
              <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
                {(checkout.error as Error).message}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2.5, sm: 4 } }}>
          {/* 「サポーターとは」「特典」は上で見せているので、申し込み方法・解約だけ */}
          <StaticSections sections={page.sections.slice(2)} />
        </CardContent>
      </Card>
    </Box>
  )

  /** ログイン状態・サポーターかどうかで変わる申し込みボタン */
  function renderAction() {
    const buttonSx = { height: 48, minWidth: { xs: '100%', sm: 240 } }
    if (closed) return <Alert severity="info">現在、サポーターの受付を停止しています。</Alert>
    if (plan.isPending || me === undefined) return <CircularProgress size={28} />
    if (me?.premium) {
      return (
        <Stack spacing={1} sx={{ alignItems: { sm: 'center' } }}>
          <Alert severity="success" sx={{ textAlign: 'left' }}>
            サポーターとして応援いただいています。ありがとうございます！
          </Alert>
          <Button component={RouterLink} to="/mypage" variant="outlined" sx={buttonSx}>
            お支払い・解約の管理（マイページ）
          </Button>
        </Stack>
      )
    }
    if (me) {
      return (
        <Button variant="contained" size="large" onClick={() => checkout.mutate()} disabled={checkout.isPending} sx={buttonSx}>
          {checkout.isPending ? '移動中…' : 'サポーターになる'}
        </Button>
      )
    }
    return (
      <Stack spacing={1} sx={{ alignItems: { sm: 'center' } }}>
        <Button component={RouterLink} to="/register" variant="contained" size="large" sx={buttonSx}>
          ユーザー登録（無料）して申し込む
        </Button>
        <Typography variant="body2" color="text.secondary">
          登録済みの方は
          <Button component={RouterLink} to="/login" size="small" sx={{ minWidth: 0, px: 0.5, verticalAlign: 'baseline' }}>
            ログイン
          </Button>
          。ログイン後、マイページから申し込めます。
        </Typography>
      </Stack>
    )
  }
}
