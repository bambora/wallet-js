import loadScript from '../utils/load-script'
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

  /**
   * Create a new ApplePay object to handle an Apple Pay session
   * @param {IDirectConfiguration<IApplePayClientConfiguration, IApplePaySessionData, ApplePayJS.ApplePayPayment, IApplePayCallbackResponse, IAuthorizeProvider<IApplePaySessionData, ApplePayJS.ApplePayPayment, IApplePayCallbackResponse>} configuration - The configuration for the Apple Pay session, including session and authorize providers, client configuration etc.
   * @param {IApplePayData} data - The ApplePayData used for the Apple Pay session
   * @returns {Promise<ApplePay>} Promise object with the created ApplePay object
   */
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

  /**
   * Checks if the device supports Apple Pay payments, using {@link https://developer.apple.com/documentation/applepayontheweb/applepaysession/canmakepayments|canmakepayments}
   * @returns {Promise<boolean>} true if device supports Apple Pay, and false if not
   */
  public isAvailable = async (): Promise<boolean> =>
    Promise.resolve(this.checkApplePaySession() && window.ApplePaySession.canMakePayments())

  /**
   * Checks the Apple Pay capabilities on the device, using {@link https://developer.apple.com/documentation/applepayontheweb/applepaysession/applepaycapabilities|applepaycapabilities}
   * @returns {Promise<ApplePayJS.PaymentCredentialStatus>} Promise object with {@link https://developer.apple.com/documentation/applepayontheweb/paymentcredentialstatus|paymentcredentialstatus}
   */
  public isCapable = async (): Promise<ApplePayJS.PaymentCredentialStatus> => {
    if (!this.checkApplePaySession()) {
      throw new Error('ApplePaySession not available')
    }

    if (!this.clientConfiguration?.merchantId) {
      throw new Error('clientConfiguration.merchantId not provided')
    }

    const response = await window.ApplePaySession.applePayCapabilities(this.clientConfiguration.merchantId)
    return response.paymentCredentialStatus
  }

  /**
   * Creates an apple-pay-button with optional overrides for buttonstyle, type and locale. See {@link https://developer.apple.com/documentation/applepayontheweb/displaying-apple-pay-buttons-using-javascript#Display-the-Button|Display-the-Button} for more
   * @param {HTMLElement} container - The container that the button will be appended to
   * @param {ButtonOptions} options - The options used for the button, including onClick event handler and optional styling options
   */
  public createButton = (container: HTMLElement, options: ButtonOptions): void => {
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

  /**
   * Start the Apple Pay session to initiate the Apple Pay payment sheet for payment authorization
   * @returns {Promise<IAuthorizeResult>} Promise object with the authorize result of the Apple Pay session
   */
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
          return
        }

        applePaySession.completeMerchantValidation(JSON.parse(walletSession.data.PaymentSession))
      }

      applePaySession.onpaymentauthorized = async (event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => {
        const authorizePaymentResponse = await this.authorizeProvider.authorizePayment(walletSession, event.payment)

        const authorizeResult =
          (authorizePaymentResponse.authorizeResult ?? authorizePaymentResponse.wait)
            ? window.ApplePaySession!.STATUS_SUCCESS
            : window.ApplePaySession!.STATUS_FAILURE

        applePaySession.completePayment(authorizeResult)

        resolve(authorizePaymentResponse)
      }

      applePaySession.oncancel = (event: ApplePayJS.Event) => reject(event)

      applePaySession.begin()
    })
  }

  private init = async (data: IApplePayData): Promise<void> => {
    await loadScript.load('https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js')

    this.applePaySessionData = data
  }

  private checkApplePaySession = (): boolean => !!window.ApplePaySession && window.ApplePaySession.supportsVersion(3)
}

export class DefaultApplePayAuthorizeProvider implements IAuthorizeProvider<
  IApplePaySessionData,
  ApplePayJS.ApplePayPayment,
  IApplePayCallbackResponse
> {
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
