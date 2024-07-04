import { GooglePay, MobilePay, Vipps } from './index'

if (window) {
  window.WorldlineOnlineCheckout = window.WorldlineOnlineCheckout || {
    GooglePay: GooglePay,
    MobilePay: MobilePay,
    Vipps: Vipps,
  }
}

declare global {
  interface WorldlineOnlineCheckout {
    GooglePay: typeof GooglePay
    MobilePay: typeof MobilePay
    Vipps: typeof Vipps
  }

  interface Window {
    WorldlineOnlineCheckout: WorldlineOnlineCheckout
  }
}

export * from './index'
