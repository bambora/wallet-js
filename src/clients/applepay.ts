import { loadScript } from '../utils/load-script'
import {
  IAuthorizeProvider,
  IAuthorizeResult,
  IClientConfiguration,
  IDirectConfiguration,
  IWalletButton,
  IWalletSessionData,
  Session,
  WalletDirectBase,
} from '../wallet'

export default class ApplePay
  extends WalletDirectBase<
    IApplePayData,
    IApplePayClientConfiguration,
    IApplePaySessionData,
    ApplePayJS.ApplePayPayment,
    IApplePayCallbackResponse,
    DefaultApplePayAuthorizeProvider
  >
  implements IWalletButton<ButtonOptions>
{
  private clientConfiguration?: IApplePayClientConfiguration
  private applePaySessionData: IApplePayData

  private constructor(
    configuration: IDirectConfiguration<
      IApplePayClientConfiguration,
      IApplePaySessionData,
      ApplePayJS.ApplePayPayment,
      IApplePayCallbackResponse,
      IAuthorizeProvider<IApplePaySessionData, ApplePayJS.ApplePayPayment, IApplePayCallbackResponse>
    >,
    data: IApplePayData,
  ) {
    super(configuration, data, defaultAuthorizeProvider)

    this.clientConfiguration = configuration.clientConfiguration
  }

  public static async create(
    configuration: IDirectConfiguration<
      IApplePayClientConfiguration,
      IApplePaySessionData,
      ApplePayJS.ApplePayPayment,
      IApplePayCallbackResponse,
      IAuthorizeProvider<IApplePaySessionData, ApplePayJS.ApplePayPayment, IApplePayCallbackResponse>
    >,
    data: IApplePayData,
  ): Promise<ApplePay> {
    const applePay = new ApplePay(configuration, data)

    await applePay.init(data)

    return applePay
  }

  private init = async (data: IApplePayData) => {
    await loadScript('https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js')

    this.applePaySessionData = data
  }

  public isAvailable = async () => {
    if (!window.ApplePaySession || !window.ApplePaySession.supportsVersion(3)) {
      return false
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (window.ApplePaySession as any).applePayCapabilities(
      this.clientConfiguration?.merchantId ?? 'platformintegrator.worldline-online-checkout-prod',
    )
    const status = response.paymentCredentialStatus

    return (
      status == 'paymentCredentialStatusAvailable' ||
      status == 'paymentCredentialStatusUnknown' ||
      status == 'paymentCredentialsUnavailable'
    )
  }

  public createButton = (container: HTMLElement, options: ButtonOptions) => {
    const button = document.createElement('apple-pay-button')
    button.addEventListener('click', options.onClick)

    if (options.buttonStyle) {
      button.setAttribute('buttonstyle', options.buttonStyle)
    }
    if (options.buttonType) {
      button.setAttribute('type', options.buttonType)
    }
    if (options.buttonLocale) {
      button.setAttribute('locale', options.buttonLocale)
    }

    container.appendChild(button)
  }

  public override start = async (): Promise<IAuthorizeResult> => {
    return new Promise((resolve, reject) => {
      if (!window.ApplePaySession) throw new Error('ApplePaySession not available')

      const applePaySession = new window.ApplePaySession(3, {
        ...this.applePaySessionData,
        merchantCapabilities: this.applePaySessionData.merchantCapabilities ?? ['supports3DS'],
      })

      let walletSession: Session<IApplePaySessionData>

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      applePaySession.onvalidatemerchant = async (event: ApplePayJS.ApplePayValidateMerchantEvent) => {
        try {
          walletSession = await this.sessionProvider.fetchSession()
        } catch (error) {
          applePaySession.abort()
          reject(error)
        }

        applePaySession.completeMerchantValidation(JSON.parse(walletSession.data.PaymentSession))
      }

      applePaySession.onpaymentauthorized = async (event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => {
        const authorizePaymentResponse = await this.authorizeProvider.authorizePayment(walletSession, event.payment)

        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        const authorizeResult =
          authorizePaymentResponse.authorizeResult ?? authorizePaymentResponse.wait
            ? window.ApplePaySession!.STATUS_SUCCESS
            : window.ApplePaySession!.STATUS_FAILURE
        /* eslint-enable @typescript-eslint/no-non-null-assertion */

        applePaySession.completePayment(authorizeResult)

        resolve(authorizePaymentResponse)
      }

      applePaySession.oncancel = (event: ApplePayJS.Event) => reject(event)

      applePaySession.begin()
    })
  }
}

export class DefaultApplePayAuthorizeProvider
  implements IAuthorizeProvider<IApplePaySessionData, ApplePayJS.ApplePayPayment, IApplePayCallbackResponse>
{
  async authorizePayment(
    walletSession: Session<IApplePaySessionData>,
    data: ApplePayJS.ApplePayPayment,
  ): Promise<IApplePayCallbackResponse> {
    const response = await fetch(walletSession.data.CallbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: walletSession.data.Identifier,
      },
      body: JSON.stringify(data),
    })

    return (await response.json()) as IApplePayCallbackResponse
  }
}

const defaultAuthorizeProvider: DefaultApplePayAuthorizeProvider = new DefaultApplePayAuthorizeProvider()

export interface IApplePaySessionData extends IWalletSessionData {
  PaymentSession: string
  Identifier: string
  CallbackUrl: string
}

export interface IApplePayCallbackResponse extends IAuthorizeResult {
  result: ApplePayJS.ApplePayPaymentAuthorizationResult
}

export interface IApplePayClientConfiguration extends IClientConfiguration {
  merchantId?: string
}

export interface ButtonOptions {
  onClick: (event: Event) => void
  buttonType?: ApplePayButtonType
  buttonStyle?: ApplePayButtonStyle
  buttonLocale?: ApplePayButtonLocale
}

export type ApplePayButtonType =
  | 'add-money'
  | 'book'
  | 'buy'
  | 'check-out'
  | 'continue'
  | 'contribute'
  | 'donate'
  | 'order'
  | 'pay'
  | 'plain'
  | 'reload'
  | 'rent'
  | 'set-up'
  | 'subscribe'
  | 'support'
  | 'tip'
  | 'top-up'

export type ApplePayButtonStyle = 'black' | 'white' | 'white-outline'

export type ApplePayButtonLocale =
  | 'ar-AB'
  | 'ca-ES'
  | 'cs-CZ'
  | 'da-DK'
  | 'de-DE'
  | 'el-GR'
  | 'en-AU'
  | 'en-GB'
  | 'en-US'
  | 'es-ES'
  | 'es-MX'
  | 'fi-FI'
  | 'fr-CA'
  | 'fr-FR'
  | 'he-IL'
  | 'hi-IN'
  | 'hr-HR'
  | 'hu-HU'
  | 'id-ID'
  | 'it-IT'
  | 'ja-JP'
  | 'ko-KR'
  | 'ms-MY'
  | 'nb-NO'
  | 'nl-NL'
  | 'pl-PL'
  | 'pt-BR'
  | 'pt-PT'
  | 'ro-RO'
  | 'ru-RU'
  | 'sk-SK'
  | 'sv-SE'
  | 'th-TH'
  | 'tr-TR'
  | 'uk-UA'
  | 'vi-VN'
  | 'zh-CN'
  | 'zh-HK'
  | 'zh-TW'

export interface IApplePayData extends Omit<ApplePayJS.ApplePayPaymentRequest, 'merchantCapabilities'> {
  merchantCapabilities?: ApplePayJS.ApplePayMerchantCapability[]
}
