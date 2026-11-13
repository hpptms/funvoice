import { Alert, Box, CircularProgress, FormControlLabel, Link, Stack, Switch, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { api, type NotifySettings } from '../../api/client'
import { currentSubscription, disablePush, enablePush, pushSupport } from '../../lib/push'

const SETTINGS_KEY = ['me', 'settings'] as const

/** マイページ: 通知の設定（このブラウザでプッシュ通知を受け取るか、種類ごとの ON/OFF） */
export default function NotifySettingsCard() {
  const qc = useQueryClient()
  const settings = useQuery({ queryKey: SETTINGS_KEY, queryFn: api.me.settings })
  const support = pushSupport()
  // このブラウザで購読しているか（undefined = 確認中）
  const [subscribed, setSubscribed] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    currentSubscription()
      .then((s) => setSubscribed(!!s))
      .catch(() => setSubscribed(false))
  }, [])

  const toggleDevice = useMutation({
    mutationFn: async (on: boolean) => {
      if (on) await enablePush()
      else await disablePush()
      return on
    },
    onSuccess: (on) => {
      setSubscribed(on)
      qc.invalidateQueries({ queryKey: SETTINGS_KEY })
    },
  })
  const save = useMutation({
    mutationFn: api.me.saveSettings,
    onSuccess: (st) => qc.setQueryData<NotifySettings>(SETTINGS_KEY, st),
  })

  if (settings.isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
  if (settings.isError) return <Alert severity="error">{(settings.error as Error).message}</Alert>
  const st = settings.data!

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        次のときに<Link component={RouterLink} to="/notifications">通知</Link>が届きます。サイトの右上のベルからいつでも確認でき、
        プッシュ通知をオンにすると、サイトを開いていなくてもスマホやパソコンに届きます（メールアドレスは使いません）。
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 14 }}>
        <li>ログイン中に書いた自分のコメントに、返信（&gt;&gt;番号）が付いたとき</li>
        <li>ログイン中に「続編希望」に投票した作品、続編を予想した作品の続編が発表されたとき</li>
      </Box>

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>このブラウザでプッシュ通知を受け取る</Typography>
        {!st.pushAvailable ? (
          <Alert severity="info">プッシュ通知は現在準備中です。サイト内の通知はご利用いただけます。</Alert>
        ) : support === 'ios-needs-install' ? (
          <Alert severity="info">
            iPhone・iPad では、Safari の共有ボタン（□↑）から「ホーム画面に追加」して、ホーム画面のFanVoiceを開くとプッシュ通知をオンにできます（iOS 16.4以降）。
          </Alert>
        ) : support === 'unsupported' ? (
          <Alert severity="info">このブラウザはプッシュ通知に対応していません。サイト内の通知はご利用いただけます。</Alert>
        ) : (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={!!subscribed}
                  disabled={subscribed === undefined || toggleDevice.isPending}
                  onChange={(e) => toggleDevice.mutate(e.target.checked)}
                />
              }
              label={subscribed ? 'オン' : 'オフ'}
              sx={{ minHeight: 44 }}
            />
            <Typography variant="caption" color="text.secondary" component="p">
              通知を受け取る端末: {st.devices}台。スマホとパソコンなど、使う端末ごとにオンにしてください。
            </Typography>
          </>
        )}
        {toggleDevice.isError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {(toggleDevice.error as Error).message}
          </Alert>
        )}
      </Box>

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>プッシュ通知する内容</Typography>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
          オフにしても、サイト内の通知一覧には届きます。
        </Typography>
        <Stack>
          <FormControlLabel
            control={<Switch checked={st.pushReply} disabled={save.isPending} onChange={(e) => save.mutate({ pushReply: e.target.checked })} />}
            label="自分のコメントへの返信"
            sx={{ minHeight: 44 }}
          />
          <FormControlLabel
            control={<Switch checked={st.pushSequel} disabled={save.isPending} onChange={(e) => save.mutate({ pushSequel: e.target.checked })} />}
            label="投票・予想した作品の続編決定"
            sx={{ minHeight: 44 }}
          />
        </Stack>
        {save.isError && <Alert severity="error">{(save.error as Error).message}</Alert>}
      </Box>
    </Stack>
  )
}
