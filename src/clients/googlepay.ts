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

export default class GooglePay
  extends WalletDirectBase<
    IGooglePayData,
    IGooglePayClientConfiguration,
    IGooglePaySessionData,
    google.payments.api.PaymentData,
    IGooglePayCallbackResponse,
    IGooglePayAuthorizeProvider
  >
  implements IWalletButton<google.payments.api.ButtonOptions>
{
  public client: google.payments.api.PaymentsClient

  private constructor(
    configuration: IDirectConfiguration<
      IGooglePayClientConfiguration,
      IGooglePaySessionData,
      google.payments.api.PaymentData,
      IGooglePayCallbackResponse,
      IGooglePayAuthorizeProvider
    >,
    data: IGooglePayData,
  ) {
    super(configuration, data, defaultAuthorizeProvider)
  }

  /**
   * Create a new GooglePay object to handle an Google Pay session
   * @param {IDirectConfiguration<IGooglePayClientConfiguration, IGooglePaySessionData, google.payments.api.PaymentData, IGooglePayCallbackResponse, IGooglePayAuthorizeProvider>} configuration - The configuration for the Google Pay session, including session and authorize providers, client configuration etc.
   * @param {IGooglePayData} data - The GooglePayData used for the Google Pay session
   * @returns {Promise<GooglePay>} Promise object with the created GooglePay object
   */
  public static async create(
    configuration: IDirectConfiguration<
      IGooglePayClientConfiguration,
      IGooglePaySessionData,
      google.payments.api.PaymentData,
      IGooglePayCallbackResponse,
      IGooglePayAuthorizeProvider
    >,
    data: IGooglePayData,
  ): Promise<GooglePay> {
    const googlePay = new GooglePay(configuration, data)

    await googlePay.init(configuration.clientConfiguration && configuration.clientConfiguration.environment)

    return googlePay
  }

  /**
   * Checks if the device is ready for Google Pay payments, using {@link https://developers.google.com/pay/api/web/reference/client#isReadyToPay|isReadyToPay}
   * @returns {Promise<boolean>} true if device is ready for Google Pay payments, and false if not
   */
  public isReady = async (): Promise<boolean> => {
    const isReadyToPayResponse = await this.client.isReadyToPay({
      allowedPaymentMethods: this.mapAllowedPaymentMethods(this.data.allowedPaymentMethods),
      apiVersion: this.data.apiVersion ?? 2,
      apiVersionMinor: this.data?.apiVersionMinor ?? 0,
    })

    return isReadyToPayResponse.result
  }

  /**
   * Creates a google-pay-button with optional overrides for buttonstyle, type and locale etc. Uses the {@link https://developers.google.com/pay/api/web/reference/client#createButton|createButton} convenience method on Google Pay PaymentsClient
   * @param {HTMLElement} container - The container that the button will be appended to
   * @param {google.payments.api.ButtonOptions} options - The options used for the button, including onClick event handler and optional styling options. See {@link https://developers.google.com/pay/api/web/reference/request-objects#ButtonOptions|ButtonOptions} for more
   */
  public createButton = (container: HTMLElement, options: google.payments.api.ButtonOptions): void => {
    const button = this.client.createButton(options)
    container.appendChild(button)
  }

  /**
   * Start the Google Pay session to initiate the Google Pay payment sheet for payment authorization
   * @returns {Promise<IAuthorizeResult | void>} Promise object with either authorize result of the Google Pay session, or in case of 3DS authentication, authorizeProvider.stepUp method is called instead
   */
  public override start = async (): Promise<IAuthorizeResult | void> => {
    const paymentData = await this.client.loadPaymentData({
      ...this.data,
      apiVersion: this.data.apiVersion ?? 2,
      apiVersionMinor: this.data.apiVersionMinor ?? 0,
      allowedPaymentMethods: this.mapAllowedPaymentMethods(this.data.allowedPaymentMethods),
      transactionInfo: {
        ...this.data.transactionInfo,
        totalPriceStatus: this.data.transactionInfo.totalPriceStatus ?? 'FINAL',
      },
    })

    const walletSession = await this.sessionProvider.fetchSession()

    const authorizePaymentResponse = await this.authorizeProvider.authorizePayment(walletSession, paymentData)

    if (authorizePaymentResponse.stepUp) {
      this.authorizeProvider.stepUp(authorizePaymentResponse)
      return
    }

    return authorizePaymentResponse
  }

  private init = async (environment?: google.payments.api.PaymentOptions['environment']) => {
    if (!('google' in (window || global) && !!window.google?.payments?.api?.PaymentsClient)) {
      await loadScript.load('https://pay.google.com/gp/p/js/pay.js')
    }

    this.client = new window.google.payments.api.PaymentsClient({
      environment: environment ?? 'PRODUCTION',
    })
  }

  private mapAllowedPaymentMethods = (
    allowedPaymentMethods: Array<IGooglePayPaymentMethodSpecification>,
  ): Array<google.payments.api.PaymentMethodSpecification> => {
    return allowedPaymentMethods.map((paymentMethod) => {
      return {
        type: 'CARD',
        parameters: {
          ...paymentMethod.parameters,
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'worldlineonlinecheckout',
            gatewayMerchantId: paymentMethod.tokenizationSpecification.parameters.gatewayMerchantId,
          },
        },
      } as google.payments.api.PaymentMethodSpecification
    })
  }
}

export interface IGooglePaySessionData extends IWalletSessionData {
  Identifier: string
  CallbackUrl: string
}

export class DefaultGooglePayAuthorizeProvider implements IGooglePayAuthorizeProvider {
  async authorizePayment(
    walletSession: Session<IGooglePaySessionData>,
    data: google.payments.api.PaymentData,
  ): Promise<IGooglePayCallbackResponse> {
    const response = await fetch(walletSession.data.CallbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: walletSession.data.Identifier,
      },
      body: data.paymentMethodData.tokenizationData.token,
    })

    return (await response.json()) as IGooglePayCallbackResponse
  }

  async stepUp(authorizeResult: IGooglePayCallbackResponse) {
    const response = await fetch(authorizeResult.redirectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        browserinformation: {
          javaenabled: false,
          javascriptenabled: true,
          language: navigator?.language ?? 'en-US',
          colordepth: screen?.colorDepth ?? 24,
          screenheight: screen?.availHeight ?? 600,
          screenwidth: screen?.availWidth ?? 800,
          timezoneoffset: new Date().getTimezoneOffset(),
        },
      }),
    })

    const data = await response.json()

    if (data?.meta?.result) {
      const formElement = document.createElement('form')
      formElement.target = '_top'
      formElement.method = 'POST'
      formElement.action = data.redirecturl
      formElement.style.display = 'none'

      data.parameters.forEach((x) => {
        const inputElement = document.createElement('input')
        inputElement.name = x.name
        inputElement.value = x.value
        inputElement.type = 'hidden'

        formElement.appendChild(inputElement)
      })

      document.body.appendChild(formElement)
      formElement.submit()
    } else {
      window.location.href = data.redirecturl
    }
  }
}

const defaultAuthorizeProvider: DefaultGooglePayAuthorizeProvider = new DefaultGooglePayAuthorizeProvider()

export interface IGooglePayCallbackResponse extends IAuthorizeResult {
  result: google.payments.api.PaymentAuthorizationResult
}

export interface IGooglePayClientConfiguration extends IClientConfiguration {
  environment?: google.payments.api.PaymentOptions['environment']
}

interface IGooglePayAuthorizeProvider extends IAuthorizeProvider<
  IGooglePaySessionData,
  google.payments.api.PaymentData,
  IGooglePayCallbackResponse
> {
  stepUp: (authorizeResult: IGooglePayCallbackResponse) => Promise<void>
}

interface IGooglePayPaymentGatewayTokenizationSpecification {
  gatewayMerchantId: string
}

interface IGooglePayPaymentMethodTokenizationSpecification extends Omit<
  google.payments.api.PaymentGatewayTokenizationSpecification,
  'type' | 'parameters'
> {
  parameters: IGooglePayPaymentGatewayTokenizationSpecification
}

type IGooglePayCardParameters = Omit<google.payments.api.CardParameters, 'allowedAuthMethods'>

interface IGooglePayPaymentMethodSpecification extends Omit<
  google.payments.api.PaymentMethodSpecification,
  'type' | 'parameters' | 'tokenizationSpecification'
> {
  parameters: IGooglePayCardParameters
  tokenizationSpecification: IGooglePayPaymentMethodTokenizationSpecification
}

interface IGooglePayTransactionInfo extends Omit<google.payments.api.TransactionInfo, 'totalPriceStatus'> {
  totalPriceStatus?: google.payments.api.TotalPriceStatus
}

export interface IGooglePayData extends Omit<
  google.payments.api.PaymentDataRequest,
  'apiVersion' | 'apiVersionMinor' | 'allowedPaymentMethods' | 'transactionInfo'
> {
  apiVersion?: number
  apiVersionMinor?: number
  allowedPaymentMethods: Array<IGooglePayPaymentMethodSpecification>
  transactionInfo: IGooglePayTransactionInfo
}
