import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useMe } from './auth'

export const UNREAD_KEY = ['me', 'unread'] as const

/** 未読の通知の数（ログイン中だけ。2分ごと・タブに戻ったときに取り直す） */
export function useUnreadCount(): number {
  const me = useMe()
  const q = useQuery({
    queryKey: UNREAD_KEY,
    queryFn: async () => (await api.me.unread()).unread,
    enabled: !!me,
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
  return me ? (q.data ?? 0) : 0
}
