import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as chaiSpies from 'chai-spies'
import { JSDOM } from 'jsdom'

import GooglePay, { IGooglePayCallbackResponse, IGooglePaySessionData } from '../src/clients/googlepay.ts'
import * as loadScript from '../src/utils/load-script.ts'
import { Session } from '../src/wallet'

const expect = chai.expect
chai.use(chaiAsPromised)
chai.use(chaiSpies)
const sandbox = chai.spy.sandbox()

const dom = new JSDOM('<!DOCTYPE html>')
const document = dom.window.document

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window: any
    }
  }
}

describe('Google Pay', () => {
  let loadScriptSpy

  beforeEach(() => {
    global.window = {}

    loadScriptSpy = sandbox.on(loadScript, 'loadScript', () => {
      global.window = { google: { payments: { api: { PaymentsClient: PaymentsClient } } } }
    })
  })

  afterEach(() => {
    sandbox.restore()
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
        expect(loadScriptSpy).to.have.been.called.once
        expect(googlePay.client['paymentOptions']['environment']).to.be.eq(data.expected)
      })
    })

    it('should throw an error due to missing configuration', async () => {
      expect(GooglePay.create({} as never, undefined as never)).to.eventually.throw(
        Error,
        'Configuration must be provided',
      )
    })

    it('should throw an error due to missing sessionProvider on configuration', async () => {
      const configuration = {
        sessionProvider: undefined,
      }
      expect(GooglePay.create({} as never, configuration as never)).to.eventually.throw(
        Error,
        'Configuration sessionProvider must be implemented',
      )
    })
  })

  describe('#isReady()', () => {
    ;[
      { value: true, expected: true },
      { value: true, expected: true },
    ].forEach((data) => {
      it('should check isReady() on Google Pay wallet', async () => {
        const googlePay = await GooglePay.create({ sessionProvider: {} as never }, {
          allowedPaymentMethods: [],
          transactionInfo: {},
        } as never)

        const isReadyToPaySpy = chai.spy.on(
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
      const createButtonSpy = chai.spy.on(googlePay.client, 'createButton', (): HTMLElement => button)

      const buttonOptions: google.payments.api.ButtonOptions = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
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
      const sessionProviderLike = chai.spy.interface({
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
      const authorizeProviderLike = chai.spy.interface({
        authorizePayment: async (): Promise<IGooglePayCallbackResponse> => authorizeResult,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
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
      const loadPaymentDataSpy = chai.spy.on(
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
      expect(authorizeProviderLike.authorizePayment).to.be.called.with.exactly(walletSession, paymentData)
      expect(authorizeProviderLike.stepUp).to.not.be.called.once
    })

    it('should start a Google Pay session with step up', async () => {
      const sessionProviderLike = chai.spy.interface('sessionProvider', ['fetchSession'])

      const authorizeResult: IGooglePayCallbackResponse = {
        authorizeResult: undefined,
        redirectUrl: 'https://google.com/accept',
        stepUp: true,
        wait: false,
        result: {
          transactionState: 'SUCCESS',
        },
      }
      const authorizeProviderLike = chai.spy.interface({
        authorizePayment: async (): Promise<IGooglePayCallbackResponse> => authorizeResult,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        stepUp: async (): Promise<void> => {},
      })

      const googlePay = await GooglePay.create(
        {
          sessionProvider: sessionProviderLike,
          authorizeProvider: authorizeProviderLike,
        },
        { allowedPaymentMethods: [], transactionInfo: {} } as never,
      )

      const loadPaymentDataSpy = chai.spy.on(
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
      expect(authorizeProviderLike.stepUp).to.be.called.with.exactly(authorizeResult)
    })
  })
})

class PaymentsClient {
  public paymentOptions

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(paymentOptions: any) {
    this.paymentOptions = paymentOptions
  }
}
