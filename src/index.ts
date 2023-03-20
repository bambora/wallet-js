import * as promise from 'es6-promise'

promise.polyfill()
import 'whatwg-fetch'
import * as errors from './errors'
import Wallet from './wallet'

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

export default Wallet
export { errors }
