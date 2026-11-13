/** 続編予想のバッジ（「発表される」を当てた数で決まる） */
export const PREDICTION_BADGES = [
  { min: 10, label: '続編マスター' },
  { min: 3, label: '続編予想士' },
  { min: 1, label: '予想見習い' },
] as const

export function predictionBadge(yesHits: number): string | null {
  return PREDICTION_BADGES.find((b) => yesHits >= b.min)?.label ?? null
}

/** 次のバッジまでの残り（最上位なら null） */
export function nextPredictionBadge(yesHits: number): { label: string; remaining: number } | null {
  const next = [...PREDICTION_BADGES].reverse().find((b) => yesHits < b.min)
  return next ? { label: next.label, remaining: next.min - yesHits } : null
}
