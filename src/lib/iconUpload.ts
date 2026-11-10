import { api, type User } from '../api/client'
import { isImageUrl } from './media'

/** アイコンの指定方法: 画像を選択（Cloudinary にアップロード）／外部の画像URL */
export type IconChoice = { kind: 'file'; file: File | null } | { kind: 'url'; url: string }

export const ICON_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'
const ICON_TYPES = new Set(ICON_ACCEPT.split(','))
export const ICON_MAX_BYTES = 5 * 1024 * 1024

/** 選んだ画像ファイルの問題（なければ null） */
export function iconFileError(file: File): string | null {
  if (!ICON_TYPES.has(file.type)) return 'png / jpg / gif / webp の画像を選んでください'
  if (file.size > ICON_MAX_BYTES) return '画像は5MB以下にしてください'
  return null
}

/** 入力に問題があればその内容（なければ null）。空欄・未選択は「変更なし」扱いで null */
export function iconChoiceError(c: IconChoice): string | null {
  if (c.kind === 'file') return c.file ? iconFileError(c.file) : null
  const url = c.url.trim()
  return url === '' || isImageUrl(url) ? null : 'https で始まる画像のURL（.png / .jpg / .gif / .webp）を指定してください'
}

/** 保存できる内容があるか（画像が選ばれている・URLが入っている） */
export const hasIconChoice = (c: IconChoice) => (c.kind === 'file' ? !!c.file : c.url.trim() !== '')

/**
 * アイコンを保存する。画像ファイルは Cloudinary へ直接アップロードしてから、サーバーにアイコンとして登録する
 * （サーバーは Cloudinary 側の実物を確認する）。
 */
export async function saveIcon(c: IconChoice): Promise<User> {
  if (c.kind === 'url') return (await api.auth.setIcon({ iconUrl: c.url.trim() })).user
  if (!c.file) throw new Error('画像を選んでください')
  const err = iconFileError(c.file)
  if (err) throw new Error(err)
  const sig = await api.auth.iconUploadSignature()
  const form = new FormData()
  for (const [k, v] of Object.entries(sig.params)) form.append(k, v)
  form.append('file', c.file)
  const res = await fetch(sig.uploadUrl, { method: 'POST', body: form })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(`画像をアップロードできませんでした${data.error?.message ? `（${data.error.message}）` : ''}`)
  }
  return (await api.auth.setIcon({ iconPublicId: sig.publicId })).user
}
