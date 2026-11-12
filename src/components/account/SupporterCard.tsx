import { Alert, Box, Button, Card, CardContent, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { api, type SubscriptionInfo } from '../../api/client'
import { ME_KEY } from '../../lib/auth'
import { formatDay, formatPrice, goToStripe, SUPPORTER_PERKS } from '../../lib/billing'

const SUB_KEY = ['subscription'] as const

/**
 * マイページの「サポーター」欄。
 * 登録・解約・カードの変更はすべて Stripe の画面で行い、このサイトではカード情報を扱わない。
 * Stripe の画面から戻ってきたとき（?billing=success|portal）は、Webhook を待たずにサーバーで状態を取り直す。
 */
export default function SupporterCard() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const returned = params.get('billing')
  const sub = useQuery({ queryKey: SUB_KEY, queryFn: api.billing.subscription, retry: false })

  const applyInfo = (info: SubscriptionInfo) => {
    qc.setQueryData(SUB_KEY, info)
    // ヘッダー・コメント欄のバッジ用に、ログイン中のユーザーも取り直す
    void qc.invalidateQueries({ queryKey: ME_KEY })
  }
  const sync = useMutation({ mutationFn: api.billing.sync, onSuccess: applyInfo })
  const checkout = useMutation({ mutationFn: async () => goToStripe((await api.billing.checkout()).url) })
  const portal = useMutation({ mutationFn: async () => goToStripe((await api.billing.portal()).url) })

  // Stripe から戻ってきたら1回だけ状態を取り直し、URL から ?billing を消す
  const synced = useRef(false)
  useEffect(() => {
    if ((returned === 'success' || returned === 'portal') && !synced.current) {
      synced.current = true
      sync.mutate()
    }
  }, [returned, sync])
  const clearReturned = () => {
    const next = new URLSearchParams(params)
    next.delete('billing')
    setParams(next, { replace: true })
  }

  // 受付をしていない・サーバーが未対応のときは欄ごと出さない
  if (sub.isError || (sub.data && !sub.data.enabled)) return null
  const info = sub.data
  const busy = checkout.isPending || portal.isPending || sync.isPending
  const actionError = (checkout.error ?? portal.error ?? sync.error) as Error | null

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="h2" sx={{ fontSize: 18, mb: 1 }}>
          サポーター
        </Typography>

        {returned === 'success' && (
          <Alert severity={sync.isPending ? 'info' : 'success'} onClose={clearReturned} sx={{ mb: 2 }}>
            {sync.isPending
              ? 'お支払いの状況を確認しています…'
              : info?.premium
                ? 'ありがとうございます！サポーターの特典が有効になりました。'
                : 'お手続きを受け付けました。反映まで少し時間がかかる場合があります（数分後にこのページを開き直してください）。'}
          </Alert>
        )}
        {returned === 'cancel' && (
          <Alert severity="info" onClose={clearReturned} sx={{ mb: 2 }}>
            お手続きは完了していません（料金は発生していません）。
          </Alert>
        )}

        {!info ? (
          <CircularProgress size={24} />
        ) : info.premium ? (
          <>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              サイトを支えていただきありがとうございます。次の特典が有効です。
            </Typography>
            <PerkList />
            {info.status === 'past_due' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                お支払いを確認できていません。「お支払い・解約の管理」からカード情報を確認してください（確認できない状態が続くと特典は終了します）。
              </Alert>
            )}
            {info.currentPeriodEnd && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {info.cancelAtPeriodEnd
                  ? `解約済みです。${formatDay(info.currentPeriodEnd)}まで特典が続きます。`
                  : `次回の更新日：${formatDay(info.currentPeriodEnd)}`}
              </Typography>
            )}
            <Button variant="outlined" onClick={() => portal.mutate()} disabled={busy} sx={{ height: 44 }}>
              {portal.isPending ? '移動中…' : 'お支払い・解約の管理'}
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              サブスクリプションでFanVoiceの運営を支援できます。サポーターには次の特典があります（
              <Link component={RouterLink} to="/supporter">
                詳しく
              </Link>
              ）。
            </Typography>
            <PerkList />
            {info.price && (
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{formatPrice(info.price)}（税込）</Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              お支払いは Stripe の決済ページで行います（このサイトではカード情報を扱いません）。いつでも解約でき、解約後も期間の終わりまで特典が続きます。
              お申し込みの前に<Link component={RouterLink} to="/terms">利用規約</Link>と
              <Link component={RouterLink} to="/tokushoho">特定商取引法に基づく表記</Link>をご確認ください。
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={() => checkout.mutate()} disabled={busy} sx={{ height: 44, minWidth: 180 }}>
                {checkout.isPending ? '移動中…' : 'サポーターになる'}
              </Button>
              {info.hasCustomer && (
                <Button color="inherit" onClick={() => portal.mutate()} disabled={busy} sx={{ height: 44 }}>
                  お支払い履歴・領収書
                </Button>
              )}
            </Stack>
          </>
        )}
        {actionError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {actionError.message}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

function PerkList() {
  return (
    <Box component="ul" sx={{ pl: 3, mt: 0, mb: 2, '& li': { lineHeight: 1.8 } }}>
      {SUPPORTER_PERKS.map((p) => (
        <Typography component="li" variant="body2" key={p}>
          {p}
        </Typography>
      ))}
    </Box>
  )
}
