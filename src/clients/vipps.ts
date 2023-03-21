import { WalletRequestType } from '../request-types'
import { IGenericWalletOptions, IWalletRequest, IWalletRequestData, IWalletResult } from '../wallet'

@WalletRequestType('Vipps')
export class VippsRequest implements IWalletRequest {
  private _target = '_self'

  constructor(private data: IVippsRequestData, options?: IGenericWalletOptions) {
    if (options) {
      if (options.target) {
        this._target = options.target
      }
    }
  }

  public initiate(): Promise<IWalletResult> {
    if (this._target === '_top') {
      const target = window.top ?? window
      target.location.href = this.data.url
    } else {
      window.location.href = this.data.url
    }

    return new Promise<IWalletResult>(() => null)
  }
}

export interface IVippsRequestData extends IWalletRequestData {
  url: string
  method: 'Redirect'
}
