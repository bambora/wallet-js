import {
  IAuthorizeProvider,
  IAuthorizeResult,
  IDirectConfiguration,
  IWalletButton,
  IWalletSessionData,
  Session,
  WalletDirectBase,
  IClientConfiguration
} from '../wallet'

import { loadScript } from '../utils/load-script'

export default class GooglePay
  extends WalletDirectBase<
    IGooglePayData,
    IGooglePayClientConfiguration,
    IGooglePaySessionData,
    google.payments.api.PaymentData,
    IGooglePayCallbackResponse,
    IGooglePayAuthorizeProvider
  >
  implements IWalletButton<google.payments.api.ButtonOptions> {
  private client: google.payments.api.PaymentsClient

  private constructor(
    configuration: IDirectConfiguration<IGooglePayClientConfiguration, IGooglePaySessionData, google.payments.api.PaymentData, IGooglePayCallbackResponse, IGooglePayAuthorizeProvider>,
    data: IGooglePayData
  ) {
    super(configuration, data, defaultAuthorizeProvider)
  }

  public get Client(): google.payments.api.PaymentsClient {
    return this.client
  }

  public static async create(
    configuration: IDirectConfiguration<IGooglePayClientConfiguration, IGooglePaySessionData, google.payments.api.PaymentData, IGooglePayCallbackResponse, IGooglePayAuthorizeProvider>,
    data: IGooglePayData
  ): Promise<GooglePay> {
    const googlePay = new GooglePay(configuration, data)

    await googlePay.init(configuration.clientConfiguration && configuration.clientConfiguration.environment)

    return googlePay
  }

  public isReady = async (): Promise<boolean> => {
    const isReadyToPayResponse = await this.client.isReadyToPay({
      allowedPaymentMethods: this.mapAllowedPaymentMethods(this.data.allowedPaymentMethods),
      apiVersion: this.data.apiVersion ?? 2,
      apiVersionMinor: this.data?.apiVersionMinor ?? 0
    })

    return isReadyToPayResponse.result
  }

  public createButton = (container: HTMLElement, options: google.payments.api.ButtonOptions): void => {
    const button = this.client.createButton(options)
    container.appendChild(button)
  }

  public override start = async (): Promise<IAuthorizeResult | void> => {
    const paymentData = await this.client.loadPaymentData({
      ...this.data,
      apiVersion: this.data.apiVersion ?? 2,
      apiVersionMinor: this.data.apiVersionMinor ?? 0,
      allowedPaymentMethods: this.mapAllowedPaymentMethods(this.data.allowedPaymentMethods),
      transactionInfo: {
        ...this.data.transactionInfo,
        totalPriceStatus: this.data.transactionInfo.totalPriceStatus ?? 'FINAL'
      }
    })

    const walletSession = await this.sessionProvider.fetchSession()

    const authorizePaymentResponse = await this.authorizeProvider.authorizePayment(
      walletSession,
      paymentData,
    )

    if (authorizePaymentResponse.stepUp) {
      this.authorizeProvider.stepUp(authorizePaymentResponse)
      return
    }

    return authorizePaymentResponse
  }

  private init = async (environment?: google.payments.api.PaymentOptions["environment"]) => {
    if (!('google' in (window || global) && !!google?.payments?.api?.PaymentsClient)) {
      await loadScript('https://pay.google.com/gp/p/js/pay.js')
    }

    this.client = new window.google.payments.api.PaymentsClient({
      environment: environment ?? 'PRODUCTION'
    })
  }

  private mapAllowedPaymentMethods = (allowedPaymentMethods: Array<IGooglePayPaymentMethodSpecification>): Array<google.payments.api.PaymentMethodSpecification> => {
    return allowedPaymentMethods.map((paymentMethod) => {
      return {
        type: 'CARD',
        parameters: {
          ...paymentMethod.parameters,
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS']
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            'gateway': 'worldlineonlinecheckout',
            'gatewayMerchantId': paymentMethod.tokenizationSpecification.parameters.gatewayMerchantId
          }
        }
      } as google.payments.api.PaymentMethodSpecification
    })
  }
}

export interface IGooglePaySessionData extends IWalletSessionData {
  Identifier: string
  CallbackUrl: string
}

export class DefaultGooglePayAuthorizeProvider
  implements IGooglePayAuthorizeProvider {
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
        Accept: 'application/json'
      },
      body: JSON.stringify({
        browserinformation: {
          javaenabled: false,
          javascriptenabled: true,
          language: navigator?.language ?? "en-US",
          colordepth: screen?.colorDepth ?? 24,
          screenheight: screen?.availHeight ?? 600,
          screenwidth: screen?.availWidth ?? 800,
          timezoneoffset: new Date().getTimezoneOffset()
        }
      }),
    })

    const data = await response.json()

    if (data?.meta?.result) {
      var formElement = document.createElement("form");
      formElement.target = "_top";
      formElement.method = "POST";
      formElement.action = data.redirecturl;
      formElement.style.display = "none";

      data.parameters.forEach(x => {
        var inputElement = document.createElement("input");
        inputElement.name = x.name;
        inputElement.value = x.value;
        inputElement.type = "hidden";

        formElement.appendChild(inputElement);
      });

      document.body.appendChild(formElement);
      formElement.submit();
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

interface IGooglePayAuthorizeProvider
  extends IAuthorizeProvider<IGooglePaySessionData, google.payments.api.PaymentData, IGooglePayCallbackResponse> {
  stepUp: (authorizeResult: IGooglePayCallbackResponse) => Promise<void>
}

interface IGooglePayPaymentGatewayTokenizationSpecification {
  gatewayMerchantId: string
}

interface IGooglePayPaymentMethodTokenizationSpecification
  extends Omit<
    google.payments.api.PaymentGatewayTokenizationSpecification,
    'type' |
    'parameters'> {
  parameters: IGooglePayPaymentGatewayTokenizationSpecification
}

interface IGooglePayCardParameters
  extends Omit<
    google.payments.api.CardParameters,
    'allowedAuthMethods'> { }

interface IGooglePayPaymentMethodSpecification
  extends Omit<
    google.payments.api.PaymentMethodSpecification,
    'type' |
    'parameters' |
    'tokenizationSpecification'> {
  parameters: IGooglePayCardParameters,
  tokenizationSpecification: IGooglePayPaymentMethodTokenizationSpecification
}

interface IGooglePayTransactionInfo
  extends Omit<
    google.payments.api.TransactionInfo,
    'totalPriceStatus'> {
  totalPriceStatus?: google.payments.api.TotalPriceStatus
}

export interface IGooglePayData
  extends Omit<
    google.payments.api.PaymentDataRequest,
    'apiVersion' |
    'apiVersionMinor' |
    'allowedPaymentMethods' |
    'transactionInfo'> {
  apiVersion?: number,
  apiVersionMinor?: number,
  allowedPaymentMethods: Array<IGooglePayPaymentMethodSpecification>,
  transactionInfo: IGooglePayTransactionInfo
}
