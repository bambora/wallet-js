import { ApplePay, GooglePay, MobilePay, Vipps } from './index'

if (window) {
  window.WorldlineOnlineCheckout = window.WorldlineOnlineCheckout || {
    ApplePay: ApplePay,
    GooglePay: GooglePay,
    MobilePay: MobilePay,
    Vipps: Vipps,
  }
}

declare global {
  interface WorldlineOnlineCheckout {
    ApplePay: typeof ApplePay
    GooglePay: typeof GooglePay
    MobilePay: typeof MobilePay
    Vipps: typeof Vipps
  }

  interface Window {
    WorldlineOnlineCheckout: WorldlineOnlineCheckout
  }
}

export * from './index'
