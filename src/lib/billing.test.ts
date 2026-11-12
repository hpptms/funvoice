import { describe, expect, it } from 'vitest'
import { formatPrice, isStripeUrl } from './billing'

describe('formatPrice', () => {
  it('円は最小単位がそのまま金額', () => {
    expect(formatPrice({ amount: 300, currency: 'jpy', interval: 'month', intervalCount: 1 })).toBe('月額 300円')
    expect(formatPrice({ amount: 3000, currency: 'jpy', interval: 'year', intervalCount: 1 })).toBe('年額 3,000円')
    expect(formatPrice({ amount: 900, currency: 'jpy', interval: 'month', intervalCount: 3 })).toBe('3か月ごと 900円')
  })
  it('ドルはセント単位', () => {
    expect(formatPrice({ amount: 499, currency: 'usd', interval: 'month', intervalCount: 1 })).toContain('4.99')
  })
})

describe('isStripeUrl', () => {
  it('Stripe の決済ページ・ポータルだけ許可', () => {
    expect(isStripeUrl('https://checkout.stripe.com/c/pay/cs_test_123')).toBe(true)
    expect(isStripeUrl('https://billing.stripe.com/p/session/test_123')).toBe(true)
  })
  it('それ以外は拒否', () => {
    expect(isStripeUrl('http://checkout.stripe.com/c/pay')).toBe(false)
    expect(isStripeUrl('https://checkout.stripe.com.evil.example/')).toBe(false)
    expect(isStripeUrl('https://evil.example/?checkout.stripe.com')).toBe(false)
    expect(isStripeUrl('javascript:alert(1)')).toBe(false)
    expect(isStripeUrl('')).toBe(false)
  })
})
