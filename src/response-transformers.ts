import { IWalletName } from './wallet'
import { IValidWalletSessionResponse, IWalletSessionResponse } from './wallet-service'

export interface IWalletResponseTransformerConstructable {
  new (): IWalletResponseTransformer
}

export interface IWalletResponseTransformer {
  transform(response: IWalletSessionResponse): IValidWalletSessionResponse
}

export const walletResponseTransformers = {}

export default function getWalletResponseTransformer(walletName: IWalletName): IWalletResponseTransformer | null {
  if (!walletName?.length) throw new TypeError('A wallet name must be supplied!')

  if (walletResponseTransformers[walletName]) return new walletResponseTransformers[walletName]()

  return null
}

// Decorator
export function WalletResponseTransformer(walletName: IWalletName) {
  if (!walletName?.length) throw new TypeError('A wallet name must be supplied!')

  return (walletTransformerConstructable: IWalletResponseTransformerConstructable) => {
    walletResponseTransformers[walletName] = walletTransformerConstructable
  }
}
