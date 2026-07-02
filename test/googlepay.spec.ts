import GooglePay from '../src/clients/googlepay.ts'
import loadScript from '../src/utils/load-script.ts'

import { expect, spy } from './setup/chai-setup.ts'

import type { IGooglePayCallbackResponse, IGooglePaySessionData } from '../src/clients/googlepay.ts'
import type { Session } from '../src/wallet'

describe('Google Pay', () => {
  let loadScriptSpy: ReturnType<typeof spy.on>

  beforeEach(() => {
    loadScriptSpy = spy.on(loadScript, 'load', () => {
      window.google = {
        payments: {
          api: {
            PaymentsClient: PaymentsClient,
          },
        },
      } as never
    })
  })

  afterEach(() => {
    window.google = undefined as never
    spy.restore()
  })

  describe('#create()', () => {
    ;[
      { value: 'TEST', expected: 'TEST' },
      { value: 'PRODUCTION', expected: 'PRODUCTION' },
      { value: null, expected: 'PRODUCTION' },
      { value: undefined, expected: 'PRODUCTION' },
    ].forEach((data) => {
      it('should return a Google Pay wallet', async () => {
        const googlePay = await GooglePay.create(
          {
            sessionProvider: {} as never,
            clientConfiguration: { environment: data.value as google.payments.api.Environment | undefined },
          },
          {} as never,
        )

        expect(googlePay).to.be.instanceOf(GooglePay)
        expect(loadScriptSpy).to.be.called.once
        const paymentOptions = (googlePay.client as unknown as { paymentOptions: { environment: string } })
          .paymentOptions
        expect(paymentOptions.environment).to.be.eq(data.expected)
      })
    })

    it('should throw an error due to missing configuration', async () => {
      await expect(GooglePay.create({} as never, undefined as never)).to.be.rejectedWith(
        Error,
        'Configuration sessionProvider must be implemented',
      )
    })

    it('should throw an error due to missing sessionProvider on configuration', async () => {
      const configuration = {
        sessionProvider: undefined,
      }
      await expect(GooglePay.create({} as never, configuration as never)).to.be.rejectedWith(
        Error,
        'Configuration sessionProvider must be implemented',
      )
    })
  })

  describe('#isReady()', () => {
    ;[
      { value: true, expected: true },
      { value: false, expected: false },
    ].forEach((data) => {
      it('should check isReady() on Google Pay wallet', async () => {
        const googlePay = await GooglePay.create({ sessionProvider: {} as never }, {
          allowedPaymentMethods: [],
          transactionInfo: {},
        } as never)

        const isReadyToPaySpy = spy.on(
          googlePay.client,
          'isReadyToPay',
          async (): Promise<google.payments.api.IsReadyToPayResponse> => {
            return { result: data.value }
          },
        )

        const result = await googlePay.isReady()

        expect(result).to.be.equal(data.expected)
        expect(isReadyToPaySpy).to.be.called.once
      })
    })
  })

  describe('#createButton()', () => {
    it('should add Google Pay button to container', async () => {
      const googlePay = await GooglePay.create({ sessionProvider: {} as never }, {} as never)

      const button = document.createElement('button')
      const createButtonSpy = spy.on(googlePay.client, 'createButton', (): HTMLElement => button)

      const buttonOptions: google.payments.api.ButtonOptions = {
        onClick: () => {},
      }
      const container = document.createElement('div')

      googlePay.createButton(container, buttonOptions)

      expect(container.childElementCount).to.be.equal(1)
      expect(container.children[0]).to.be.equal(button)
      expect(createButtonSpy).to.be.called.once
    })
  })

  describe('#start()', () => {
    it('should start a Google Pay session', async () => {
      const walletSession: Session<IGooglePaySessionData> = {
        data: { Identifier: '123', CallbackUrl: 'https://google.com/callback' },
      }
      const sessionProviderLike = spy.interface({
        fetchSession: async (): Promise<Session<IGooglePaySessionData>> => walletSession,
      })

      const authorizeResult: IGooglePayCallbackResponse = {
        authorizeResult: true,
        redirectUrl: 'https://google.com/accept',
        stepUp: false,
        wait: false,
        result: {
          transactionState: 'SUCCESS',
        },
      }
      const authorizeProviderLike = spy.interface({
        authorizePayment: async (): Promise<IGooglePayCallbackResponse> => authorizeResult,

        stepUp: async (): Promise<void> => {},
      })

      const googlePay = await GooglePay.create(
        {
          sessionProvider: sessionProviderLike,
          authorizeProvider: authorizeProviderLike,
        },
        { allowedPaymentMethods: [], transactionInfo: {} } as never,
      )

      const paymentData: google.payments.api.PaymentData = {
        apiVersion: 1,
        apiVersionMinor: 1,
        paymentMethodData: {
          type: 'CARD',
          tokenizationData: {
            type: 'PAYMENT_GATEWAY',
            token: 'token123',
          },
        },
      }
      const loadPaymentDataSpy = spy.on(
        googlePay.client,
        'loadPaymentData',
        async (): Promise<google.payments.api.PaymentData> => {
          return paymentData
        },
      )

      const result = await googlePay.start()

      expect(result).to.be.equal(authorizeResult)
      expect(googlePay).to.be.instanceOf(GooglePay)
      expect(loadPaymentDataSpy).to.be.called.once
      expect(authorizeProviderLike.authorizePayment).to.be.called.once
      expect(authorizeProviderLike.authorizePayment).to.called.with(walletSession, paymentData)
      expect(authorizeProviderLike.stepUp).to.not.be.called.once
    })

    it('should start a Google Pay session with step up', async () => {
      const sessionProviderLike = spy.interface({
        fetchSession: async (): Promise<Session<IGooglePaySessionData>> => {
          return {} as never
        },
      })

      const authorizeResult: IGooglePayCallbackResponse = {
        authorizeResult: undefined,
        redirectUrl: 'https://google.com/accept',
        stepUp: true,
        wait: false,
        result: {
          transactionState: 'SUCCESS',
        },
      }
      const authorizeProviderLike = spy.interface({
        authorizePayment: async (): Promise<IGooglePayCallbackResponse> => authorizeResult,

        stepUp: async (): Promise<void> => {},
      })

      const googlePay = await GooglePay.create(
        {
          sessionProvider: sessionProviderLike,
          authorizeProvider: authorizeProviderLike,
        },
        { allowedPaymentMethods: [], transactionInfo: {} } as never,
      )

      const loadPaymentDataSpy = spy.on(
        googlePay.client,
        'loadPaymentData',
        async (): Promise<google.payments.api.PaymentData> => {
          return {} as never
        },
      )

      const result = await googlePay.start()

      expect(result).to.be.equal(undefined)
      expect(googlePay).to.be.instanceOf(GooglePay)
      expect(loadPaymentDataSpy).to.be.called.once
      expect(authorizeProviderLike.authorizePayment).to.be.called.once
      expect(authorizeProviderLike.stepUp).to.be.called.once
      expect(authorizeProviderLike.stepUp).to.be.called.with(authorizeResult)
    })
  })
})

class PaymentsClient {
  public paymentOptions

  constructor(paymentOptions: never) {
    this.paymentOptions = paymentOptions
  }
}
