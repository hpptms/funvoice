/**
 * 投稿した本人のブラウザでだけ使う「手元の画像」。
 *
 * Cloudinary の WebP 変換は、最初に表示されるときに行われるので少し時間がかかる。
 * その間に投稿者が「画像が出ない」と感じないよう、選んだファイルをそのまま表示しておき、
 * 変換済みの画像が届いたら差し替える。ページを再読み込みすると消える（メモリ上だけ）。
 */
const store = new Map<string, string>()

/** 投稿した画像のファイルを、Cloudinary の public_id と結び付けて覚えておく */
export function rememberLocalImage(publicId: string, file: File) {
  releaseLocalImage(publicId)
  store.set(publicId, URL.createObjectURL(file))
}

/** 手元の画像のURL（blob:）。なければ undefined */
export function getLocalImage(publicId: string | undefined): string | undefined {
  return publicId ? store.get(publicId) : undefined
}

/** 変換済みの画像が表示できたら、手元の画像を解放する */
export function releaseLocalImage(publicId: string) {
  const url = store.get(publicId)
  if (url) {
    URL.revokeObjectURL(url)
    store.delete(publicId)
  }
}
