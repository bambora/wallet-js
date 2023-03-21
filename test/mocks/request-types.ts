import getWalletRequestType from '../../src/request-types'
import { IWalletRequest, IWalletResult } from '../../src/wallet'

export function mockGetWalletRequestType(walletResult: IWalletResult): typeof getWalletRequestType {
  return () => {
    return class Mock implements IWalletRequest {
      constructor() {
        /*.*/
      }

      public initiate(): Promise<IWalletResult> {
        return Promise.resolve(walletResult)
      }
    }
  }
}
