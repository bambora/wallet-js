import * as endpoints from './endpoints'
import getWalletResponseTransformer from './response-transformers'
import { IGenericWalletOptions, IKeyValueType, IWalletName } from './wallet'

declare const VERSION: string

export default class WalletService implements IWalletService {
  private _endpoint = endpoints.epayZero.walletApi

  private _defaultHeaders = {
    Accept: 'application/json, text/plain, */*',
    'X-EPay-System': `WalletSDK/${VERSION}`,
  }

  private _fetch: typeof fetch
  private _getWalletResponseTransformer: typeof getWalletResponseTransformer

  constructor(
    options?: IGenericWalletOptions,
    fetchFn?: typeof fetch,
    getWalletResponseTransformerFn?: typeof getWalletResponseTransformer,
  ) {
    this._fetch = fetchFn || fetch.bind(window)
    this._getWalletResponseTransformer = getWalletResponseTransformerFn || getWalletResponseTransformer

    if (options) {
      if (options.endpoint) this._endpoint = options.endpoint

      if (options.defaultHeaders)
        this._defaultHeaders = options.defaultHeaders as {
          Accept: string
          'X-EPay-System': string
        }
    }
  }

  public getSession(sessionId: string): Promise<IValidWalletSessionResponse> {
    const promise = this._fetch(`${this._endpoint}/sessions/${sessionId}`, {
      headers: this._defaultHeaders,
    })
      .then<IWalletSessionResponse>((response) => {
        return response.json()
      })
      .then<IValidWalletSessionResponse>((jsonResponse) => {
        const transformer = this._getWalletResponseTransformer(jsonResponse.session.walletname)
        if (transformer) {
          return transformer.transform(jsonResponse)
        }
        return jsonResponse
      })

    return promise
  }
}

export interface IWalletService {
  getSession: (sessionId: string) => Promise<IValidWalletSessionResponse>
}

export interface IWalletServiceConstructable {
  new (options?: IGenericWalletOptions): IWalletService
}

export interface IWalletSessionResponse {
  session: {
    walletname: IWalletName
    data: Array<IKeyValueType<string>>
  }
}

export interface IValidWalletSessionResponse {
  session: {
    walletname: IWalletName
    data: Array<IKeyValueType<unknown>>
  }
}
