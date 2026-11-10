import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type User } from '../api/client'

export const ME_KEY = ['me'] as const

/** ログイン中のユーザー（未ログインなら null、読み込み中は undefined） */
export function useMe(): User | null | undefined {
  const q = useQuery({ queryKey: ME_KEY, queryFn: async () => (await api.auth.me()).user, staleTime: 5 * 60_000 })
  return q.isError ? null : q.data
}

/** ログイン・登録・ログアウト・アイコン変更の後に、画面のログイン状態を差し替える */
export function useSetMe() {
  const qc = useQueryClient()
  return (user: User | null) => qc.setQueryData(ME_KEY, user)
}
