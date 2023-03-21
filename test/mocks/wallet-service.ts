import { IValidWalletSessionResponse } from '../../src/wallet-service'

export function mockWalletService(response: IValidWalletSessionResponse) {
  return class Mock {
    public getSession(): Promise<IValidWalletSessionResponse> {
      return Promise.resolve(response)
    }
  }
}
