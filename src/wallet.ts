import getWalletRequestType from './request-types'
import WalletService, { IWalletServiceConstructable } from './wallet-service'

export default class Wallet {
  private static getWalletOptions(responseData: Array<IKeyValueType<unknown>>): IWalletRequestData {
    const walletOptions = responseData.reduce((previous, current) => {
      previous[current.key] = current.value
      return previous
    }, {} as IWalletRequestData)

    return walletOptions
  }

  private _walletService: IWalletServiceConstructable
  private _getWalletRequestType: typeof getWalletRequestType

  constructor(
    walletServiceConstructable?: IWalletServiceConstructable,
    getWalletRequestTypeFn?: typeof getWalletRequestType,
  ) {
    this._walletService = walletServiceConstructable || WalletService
    this._getWalletRequestType = getWalletRequestTypeFn || getWalletRequestType
  }

  public open(sessionId: string, options: IGenericWalletOptions = {}): Promise<IWalletResult> {
    options.preferredWindowState = options.preferredWindowState || 'overlay'

    const walletService = new this._walletService(options)
    const getWalletRequestType = this._getWalletRequestType

    const sessionPromise = walletService.getSession(sessionId).then(function onGetSessionFulfilled(response) {
      const walletRequestConstructable = getWalletRequestType(response.session.walletname)
      const walletOptions = Wallet.getWalletOptions(response.session.data)
      const walletRequest = new walletRequestConstructable(walletOptions, options)

      return walletRequest.initiate()
    })

    return sessionPromise
  }
}

// Generic wallet
export type IWalletName = 'MobilePay' | 'Test' | 'Vipps'

export type IPreferredWindowState = 'fullscreen' | 'overlay'

export interface IGenericWalletOptions {
  preferredWindowState?: IPreferredWindowState // default : "overlay"
  endpoint?: string // default : bambora default API endpoint
  defaultHeaders?: unknown // default : undefined
  pollTimeout?: number // default : 120 (seconds)
  walletEndpoint?: string // default : wallet endpoint default
  target?: '_self' | '_top' // default : "_self"
}

export interface IKeyValueType<T> {
  key: string
  value: T
  type?: 'string' | 'array'
}

// Request
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IWalletRequestData {}

export interface IWalletRequest {
  /** Initiates the wallet request */
  initiate(): Promise<IWalletResult>
}

export interface IWalletResult {
  walletName: IWalletName
  data: unknown
}

export interface IMetaResponse {
  meta: {
    result: boolean
    message: {
      enduser: string
      merchant: string
    }
    action: {
      source: string
      code: string
      type: string
    }
    paging: {
      lastevaluatedkey: string
      itemsreturned: number
    }
  }
}
