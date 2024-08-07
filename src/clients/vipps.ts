import { IClientConfiguration, IOffsiteConfiguration, IWalletSessionData, WalletOffsiteBase } from '../wallet'

export default class Vipps extends WalletOffsiteBase<IVippsData, IClientConfiguration, IVippsSessionData> {
  private _target = '_top'

  private constructor(
    configuration: IOffsiteConfiguration<IClientConfiguration, IVippsSessionData>,
    data?: IVippsData,
  ) {
    super(configuration, data)

    this._target = data?.target ?? this._target
  }

  public static create(
    configuration: IOffsiteConfiguration<IClientConfiguration, IVippsSessionData>,
    data?: IVippsData,
  ): Vipps {
    return new Vipps(configuration, data)
  }

  public override start = async (): Promise<void> => {
    const walletSession = await this.sessionProvider.fetchSession()

    if (this._target === '_top') {
      const target = window.top ?? window
      target.location.href = walletSession.data.url
    } else {
      window.location.href = walletSession.data.url
    }
  }
}

export interface IVippsData {
  target: '_self' | '_top'
}

export interface IVippsSessionData extends IWalletSessionData {
  url: string
}
