import getWalletResponseTransformer, { IWalletResponseTransformer } from '../../src/response-transformers'
import { IValidWalletSessionResponse } from '../../src/wallet-service'

export function mockGetWalletResponseTransformer(
  validWalletSessionResponse: IValidWalletSessionResponse,
): typeof getWalletResponseTransformer {
  return (): IWalletResponseTransformer => {
    return {
      transform: (): IValidWalletSessionResponse => {
        return validWalletSessionResponse
      },
    }
  }
}
