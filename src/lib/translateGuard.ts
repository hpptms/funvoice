// ブラウザの自動翻訳（Chrome / Edge / Safari など）を使っても画面が落ちないようにするための対策。
// 翻訳機能はテキストノードを <font> などに置き換えるため、React が元のノードを外そう・前に挿入しようとすると
// 「親が違う」として removeChild / insertBefore が例外を投げ、画面全体が真っ白になる。
// 親が違うときだけ何もせずに戻すことで、翻訳した表示のまま操作を続けられるようにする。
// （翻訳中に変わった文字が一瞬古い訳のまま残ることはあるが、落ちるよりはずっと良い）
export function installTranslateGuard() {
  if (typeof Node !== 'function' || !Node.prototype) return

  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, refNode: Node | null): T {
    if (refNode && refNode.parentNode !== this) return newNode
    return originalInsertBefore.call(this, newNode, refNode) as T
  }
}
