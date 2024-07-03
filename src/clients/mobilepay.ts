import { IOffsiteConfiguration, IWalletSessionData, WalletOffsiteBase, IClientConfiguration } from '../wallet'

export default class MobilePay extends WalletOffsiteBase<
  IMobilePayData,
  IClientConfiguration,
  IMobilePaySessionData
> {
  private _target = '_self'

  private constructor(configuration: IOffsiteConfiguration<IClientConfiguration, IMobilePaySessionData>, data?: IMobilePayData) {
    super(configuration, data)

    this._target = data?.target ?? this._target
  }

  public static create(
    configuration: IOffsiteConfiguration<IClientConfiguration, IMobilePaySessionData>,
    data?: IMobilePayData
  ): MobilePay {
    return new MobilePay(configuration, data)
  }

  public override start = async (): Promise<void> => {
    const walletSession = await this.sessionProvider.fetchSession();

    if (this._target === '_top') {
      const target = window.top ?? window
      target.location.href = walletSession.data.Url
    } else {
      window.location.href = walletSession.data.Url
    }
  }
}

export interface IMobilePayData {
  target: '_self' | '_top' | string
}

export interface IMobilePaySessionData extends IWalletSessionData {
  Url: string
}
