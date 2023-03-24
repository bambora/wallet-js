import Wallet, { errors } from './index'

if (window) {
  window.Bambora = window.Bambora || {}
  window.Bambora.Wallet = window.Bambora.Wallet || Wallet
  window.Bambora.WalletErrors = window.Bambora.WalletErrors || errors
}

declare global {
  interface Bambora {
    Wallet?: typeof Wallet
    WalletErrors?: typeof errors
  }

  interface Window {
    Bambora: Bambora
  }
}

export * from './index'
