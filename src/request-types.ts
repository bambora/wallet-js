/* eslint-disable import/order */
import { IGenericWalletOptions, IWalletName, IWalletRequest, IWalletRequestData } from './wallet'

export interface IWalletRequestConstructable {
  new (data: IWalletRequestData, options?: IGenericWalletOptions): IWalletRequest
}

export const walletRequestTypes = {}

export default function getWalletRequestTypeFn(walletName: IWalletName): IWalletRequestConstructable {
  if (typeof walletName !== 'string' || !walletName.length) throw new TypeError('A wallet name must be supplied!')

  if (walletRequestTypes[walletName]) return walletRequestTypes[walletName]

  throw new ReferenceError(`The wallet type "${walletName}" could not be found.`)
}

// Decorator
export function WalletRequestType(
  walletName: IWalletName,
): (walletRequestConstructable: IWalletRequestConstructable) => void {
  if (typeof walletName !== 'string' || !walletName.length) throw new TypeError('A wallet name must be supplied!')

  return (walletRequestConstructable: IWalletRequestConstructable) => {
    walletRequestTypes[walletName] = walletRequestConstructable
  }
}

import * as clients from './clients'

clients
