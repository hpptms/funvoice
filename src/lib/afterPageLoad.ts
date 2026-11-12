/** ページの読み込み（load）が終わり、さらにブラウザの手が空いたときに実行する */
export function afterPageLoad(fn: () => void) {
  const idle = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 3000 })
    else setTimeout(fn, 1000)
  }
  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}
