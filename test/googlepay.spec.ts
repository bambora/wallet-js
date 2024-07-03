import 'mocha'
import * as chai from 'chai'
import * as chaiSpies from 'chai-spies';
import * as chaiAsPromised from 'chai-as-promised'
import { JSDOM } from 'jsdom';
import * as loadScript from '../src/utils/load-script.ts'
import { Session } from '../src/wallet';
import GooglePay, { IGooglePaySessionData, IGooglePayCallbackResponse } from '../src/clients/googlepay.ts'

const expect = chai.expect
chai.use(chaiAsPromised)
chai.use(chaiSpies)
const sandbox = chai.spy.sandbox()

const dom = new JSDOM('<!DOCTYPE html>')
const document = dom.window.document

declare global {
  namespace NodeJS {
    interface Global {
      window: any;
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
    ([
      { value: 'TEST', expected: 'TEST' },
      { value: 'PRODUCTION', expected: 'PRODUCTION' },
      { value: null, expected: 'PRODUCTION' },
      { value: undefined, expected: 'PRODUCTION' }
    ]).forEach((data) => {
      it('should return a Google Pay wallet', async () => {
        const googlePay = await GooglePay.create(
          {
            sessionProvider: {} as any,
            clientConfiguration: { environment: data.value as google.payments.api.Environment | undefined }
          },
          {} as any
        )

        expect(googlePay).to.be.instanceOf(GooglePay)
        expect(loadScriptSpy).to.have.been.called.once
        expect(googlePay.Client['paymentOptions']['environment']).to.be.eq(data.expected)
      })
    })

    it('should throw an error due to missing configuration', async () => {
      expect(GooglePay.create({} as any, undefined as any)).to.eventually.throw(Error, 'Configuration must be provided')
    })

    it('should throw an error due to missing sessionProvider on configuration', async () => {
      const configuration = {
        sessionProvider: undefined
      }
      expect(GooglePay.create({} as any, configuration as any)).to.eventually.throw(Error, 'Configuration sessionProvider must be implemented')
    })
  })

  describe('#isReady()', () => {
    ([
      { value: true, expected: true },
      { value: true, expected: true }
    ]).forEach((data) => {
      it('should check isReady() on Google Pay wallet', async () => {
        const googlePay = await GooglePay.create(
          { sessionProvider: {} as any },
          { allowedPaymentMethods: [], transactionInfo: {} } as any
        )

        const isReadyToPaySpy = chai.spy.on(googlePay.Client, 'isReadyToPay', async (
          request: google.payments.api.IsReadyToPayRequest
        ): Promise<google.payments.api.IsReadyToPayResponse> => { return { result: data.value } })

        const result = await googlePay.isReady()

        expect(result).to.be.equal(data.expected)
        expect(isReadyToPaySpy).to.be.called.once
      })
    })
  })

  describe('#createButton()', () => {
    it('should add Google Pay button to container', async () => {
      const googlePay = await GooglePay.create(
        { sessionProvider: {} as any },
        {} as any
      )

      const button = document.createElement('button')
      const createButtonSpy = chai.spy.on(googlePay.Client, 'createButton', (
        options: google.payments.api.ButtonOptions
      ): HTMLElement => button)

      const buttonOptions: google.payments.api.ButtonOptions = {
        onClick: (event) => { }
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
        data: { Identifier: '123', CallbackUrl: 'https://google.com/callback' }
      }
      const sessionProviderLike = chai.spy.interface({
        fetchSession: async (): Promise<Session<IGooglePaySessionData>> => walletSession
      })

      const authorizeResult: IGooglePayCallbackResponse = {
        authorizeResult: true,
        redirectUrl: 'https://google.com/accept',
        stepUp: false,
        wait: false,
        result: {
          transactionState: 'SUCCESS'
        }
      }
      const authorizeProviderLike = chai.spy.interface({
        authorizePayment: async (
          walletSession: Session<IGooglePaySessionData>,
          data: google.payments.api.PaymentData
        ): Promise<IGooglePayCallbackResponse> => authorizeResult,
        stepUp: async (authorizeResult: IGooglePayCallbackResponse): Promise<void> => { }
      })

      const googlePay = await GooglePay.create(
        {
          sessionProvider: sessionProviderLike,
          authorizeProvider: authorizeProviderLike
        },
        { allowedPaymentMethods: [], transactionInfo: {} } as any
      )

      const paymentData: google.payments.api.PaymentData = {
        apiVersion: 1,
        apiVersionMinor: 1,
        paymentMethodData: {
          type: 'CARD',
          tokenizationData: {
            type: 'PAYMENT_GATEWAY',
            token: 'token123'
          }
        }
      }
      const loadPaymentDataSpy = chai.spy.on(googlePay.Client, 'loadPaymentData', async (
        request: google.payments.api.PaymentDataRequest
      ): Promise<google.payments.api.PaymentData> => {
        return paymentData
      })

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
          transactionState: 'SUCCESS'
        }
      }
      const authorizeProviderLike = chai.spy.interface({
        authorizePayment: async (
          walletSession: Session<IGooglePaySessionData>,
          data: google.payments.api.PaymentData
        ): Promise<IGooglePayCallbackResponse> => authorizeResult,
        stepUp: async (authorizeResult: IGooglePayCallbackResponse): Promise<void> => { }
      })

      const googlePay = await GooglePay.create(
        {
          sessionProvider: sessionProviderLike,
          authorizeProvider: authorizeProviderLike
        },
        { allowedPaymentMethods: [], transactionInfo: {} } as any
      )

      const loadPaymentDataSpy = chai.spy.on(googlePay.Client, 'loadPaymentData', async (
        request: google.payments.api.PaymentDataRequest
      ): Promise<google.payments.api.PaymentData> => {
        return {} as any
      })

      const result = await googlePay.start()

      expect(result).to.be.equal(undefined)
      expect(googlePay).to.be.instanceOf(GooglePay)
      expect(loadPaymentDataSpy).to.be.called.once
      expect(authorizeProviderLike.authorizePayment).to.be.called.once
      expect(authorizeProviderLike.stepUp).to.be.called.once
      expect(authorizeProviderLike.stepUp).to.be.called.with.exactly(authorizeResult)
    })
  });
})

class PaymentsClient {
  public paymentOptions

  constructor(paymentOptions: any) {
    this.paymentOptions = paymentOptions
  }
}
