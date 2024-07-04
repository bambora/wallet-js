export interface ISessionProvider<TSessionData extends IWalletSessionData> {
  fetchSession: () => Promise<Session<TSessionData>>
}

export interface IAuthorizeProvider<
  TSessionData extends IWalletSessionData,
  TAuthorizeData,
  TAuthorizeResult extends IAuthorizeResult,
> {
  authorizePayment: (session: Session<TSessionData>, data: TAuthorizeData) => Promise<TAuthorizeResult>
}

interface IConfiguration<TClientConfiguration extends IClientConfiguration, TSessionData extends IWalletSessionData> {
  clientConfiguration?: TClientConfiguration
  sessionProvider: ISessionProvider<TSessionData>
}

export interface IDirectConfiguration<
  TClientConfiguration extends IClientConfiguration,
  TSessionData extends IWalletSessionData,
  TAuthorizeData,
  TAuthorizeResult extends IAuthorizeResult,
  TAuthorizeProvider extends IAuthorizeProvider<TSessionData, TAuthorizeData, TAuthorizeResult>,
> extends IConfiguration<TClientConfiguration, TSessionData> {
  authorizeProvider?: TAuthorizeProvider
}

export type IOffsiteConfiguration<
  TClientConfiguration extends IClientConfiguration,
  TSessionData extends IWalletSessionData,
> = IConfiguration<TClientConfiguration, TSessionData>

abstract class WalletBase<
  TData,
  TClientConfiguration extends IClientConfiguration,
  TSessionData extends IWalletSessionData,
> implements IWallet
{
  protected data?: TData
  protected sessionProvider: ISessionProvider<TSessionData>

  constructor(configuration: IConfiguration<TClientConfiguration, TSessionData>, data?: TData) {
    this.data = data

    if (!configuration) {
      throw new Error('Configuration must be provided')
    }

    if (!configuration.sessionProvider) {
      throw new Error('Configuration sessionProvider must be implemented')
    }

    this.sessionProvider = configuration.sessionProvider
  }
}

export abstract class WalletOffsiteBase<
    TData,
    TClientConfiguration extends IClientConfiguration,
    TSessionData extends IWalletSessionData,
  >
  extends WalletBase<TData, TClientConfiguration, TSessionData>
  implements IWalletOffsite
{
  start: () => Promise<void>
}

export abstract class WalletDirectBase<
    TData,
    TClientConfiguration extends IClientConfiguration,
    TSessionData extends IWalletSessionData,
    TAuthorizeData,
    TAuthorizeResult extends IAuthorizeResult,
    TAuthorizeProvider extends IAuthorizeProvider<TSessionData, TAuthorizeData, TAuthorizeResult>,
  >
  extends WalletBase<TData, TClientConfiguration, TSessionData>
  implements IWalletDirect
{
  protected override data: TData
  protected authorizeProvider: TAuthorizeProvider

  constructor(
    configuration: IDirectConfiguration<
      TClientConfiguration,
      TSessionData,
      TAuthorizeData,
      TAuthorizeResult,
      TAuthorizeProvider
    >,
    data: TData,
    defaultAuthorizeProvider: TAuthorizeProvider,
  ) {
    super(configuration, data)

    this.authorizeProvider = configuration.authorizeProvider ?? defaultAuthorizeProvider
  }

  abstract start: () => Promise<IAuthorizeResult | void>
}

export interface IWalletButton<TButtonOptions> {
  createButton: (container: HTMLElement, options: TButtonOptions) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IWalletData {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IWalletSessionData {}

export interface IWalletDirect extends IWallet {
  start: () => Promise<IAuthorizeResult | void>
}

export interface IWalletOffsite extends IWallet {
  start: () => Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IWallet {}

export interface IAuthorizeResult {
  authorizeResult?: boolean
  stepUp: boolean
  wait: boolean
  redirectUrl: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IClientConfiguration {}

export type Session<TSessionData> = {
  data: TSessionData
}
