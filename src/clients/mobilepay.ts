import { WalletRequestType } from '../request-types'
import { IGenericWalletOptions, IWalletRequest, IWalletResult } from '../wallet'

@WalletRequestType('MobilePay')
export class MobilePayRequest implements IWalletRequest {
  private _target = '_self'

  constructor(private data: IMobilePayRequestData, options?: IGenericWalletOptions) {
    if (options) {
      if (options.target) {
        this._target = options.target
      }
    }
  }

  public initiate(): Promise<IWalletResult> {
    if (this._target === '_top') {
      const target = window.top ?? window
      target.location.href = this.data.Url
    } else {
      window.location.href = this.data.Url
    }

    return new Promise<IWalletResult>(() => null)
  }
}

export interface IMobilePayRequestData {
  Url: string
}
