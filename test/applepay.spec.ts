import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as chaiSpies from 'chai-spies'
import { JSDOM } from 'jsdom'

import ApplePay, { ButtonOptions, IApplePayCallbackResponse, IApplePaySessionData } from '../src/clients/applepay.ts'
import * as loadScript from '../src/utils/load-script.ts'
import { Session } from '../src/wallet'

const expect = chai.expect
chai.use(chaiAsPromised)
chai.use(chaiSpies)
const sandbox = chai.spy.sandbox()

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window: any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document: Document
    }
  }
}

describe('Apple Pay', () => {
  let loadScriptSpy

  beforeEach(() => {
    global.window = { ApplePaySession: ApplePaySessionMock }

    const dom = new JSDOM('<!DOCTYPE html>')
    global.document = dom.window.document

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    loadScriptSpy = sandbox.on(loadScript, 'loadScript', () => {})
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#create()', () => {
    it('should return an Apple Pay wallet', async () => {
      const applePay = await ApplePay.create(
        {
          sessionProvider: {} as never,
          clientConfiguration: {} as never,
        },
        {} as never,
      )

      expect(applePay).to.be.instanceOf(ApplePay)
      expect(loadScriptSpy).to.have.been.called.once
    })

    it('should throw an error due to missing configuration', async () => {
      expect(ApplePay.create({} as never, undefined as never)).to.eventually.throw(
        Error,
        'Configuration must be provided',
      )
    })

    it('should throw an error due to missing sessionProvider on configuration', async () => {
      const configuration = {
        sessionProvider: undefined,
      }
      expect(ApplePay.create({} as never, configuration as never)).to.eventually.throw(
        Error,
        'Configuration sessionProvider must be implemented',
      )
    })
  })

  describe('#isAvailable()', () => {
    ;[
      { applePaySession: false, supportsVersion: false, applePayCapabilities: false, expected: false },
      { applePaySession: true, supportsVersion: false, applePayCapabilities: false, expected: false },
      { applePaySession: true, supportsVersion: true, applePayCapabilities: false, expected: false },
      { applePaySession: true, supportsVersion: true, applePayCapabilities: true, expected: true },
    ].forEach((data) => {
      it('should check isAvailable() on Apple Pay wallet', async () => {
        global.window = data.applePaySession ? global.window : { ApplePaySession: undefined }

        let supportsVersionSpy
        let canMakePaymentsSpy

        if (data.applePaySession) {
          supportsVersionSpy = sandbox.on(
            global.window.ApplePaySession,
            'supportsVersion',
            (): boolean => data.supportsVersion,
          )

          canMakePaymentsSpy = sandbox.on(
            global.window.ApplePaySession,
            'applePayCapabilities',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (): Promise<any> =>
              new Promise((resolve) =>
                resolve(
                  data.applePayCapabilities
                    ? { paymentCredentialStatus: 'paymentCredentialStatusAvailable' }
                    : { paymentCredentialStatus: '' },
                ),
              ),
          )
        }

        const applePay = await ApplePay.create(
          {
            sessionProvider: {} as never,
            clientConfiguration: {} as never,
          },
          {} as never,
        )

        const result = await applePay.isAvailable()

        expect(result).to.be.equal(data.expected)
        if (data.applePaySession) {
          const supportsVersionSpyExpectedCall = data.applePaySession ? 1 : 0
          expect(supportsVersionSpy).to.be.called.exactly(supportsVersionSpyExpectedCall)
          const canMakePaymentsSpyExpectedCalls = data.applePaySession && data.supportsVersion ? 1 : 0
          expect(canMakePaymentsSpy).to.be.called.exactly(canMakePaymentsSpyExpectedCalls)
        }
      })
    })
  })

  describe('#createButton()', () => {
    it('should add Apple Pay button to container', async () => {
      const applePay = await ApplePay.create({ sessionProvider: {} as never }, {} as never)

      const buttonOptions: ButtonOptions = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClick: () => {},
        buttonLocale: 'en-GB',
        buttonStyle: 'black',
        buttonType: 'pay',
      }
      const container = document.createElement('div')

      applePay.createButton(container, buttonOptions)

      expect(container.childElementCount).to.be.equal(1)
      const button = container.children[0]
      expect(button.nodeName.toLowerCase()).to.be.equal('apple-pay-button')
      expect(button.getAttribute('locale')).to.be.equal(buttonOptions.buttonLocale)
      expect(button.getAttribute('buttonstyle')).to.be.equal(buttonOptions.buttonStyle)
      expect(button.getAttribute('type')).to.be.equal(buttonOptions.buttonType)
    })
  })

  describe('#start()', () => {
    it('should start an Apple Pay session', async () => {
      const walletSession: Session<IApplePaySessionData> = {
        data: {
          Identifier: 'Identifier123',
          CallbackUrl: 'https://apple.com/callback',
          PaymentSession: '{"paymentsession": "PaymentSession123"}',
        },
      }
      const sessionProviderLike = chai.spy.interface({
        fetchSession: async (): Promise<Session<IApplePaySessionData>> => walletSession,
      })

      const authorizeResult: IApplePayCallbackResponse = {
        authorizeResult: true,
        redirectUrl: 'https://apple.com/accept',
        stepUp: false,
        wait: false,
        result: {
          status: 1,
        },
      }
      const authorizeProviderLike = chai.spy.interface({
        authorizePayment: async (): Promise<IApplePayCallbackResponse> => authorizeResult,
      })

      const applePay = await ApplePay.create(
        {
          sessionProvider: sessionProviderLike,
          authorizeProvider: authorizeProviderLike,
        },
        {} as ApplePayJS.ApplePayPaymentRequest,
      )

      const result = await applePay.start()

      expect(result).to.be.equal(authorizeResult)
      expect(applePay).to.be.instanceOf(ApplePay)
      expect(sessionProviderLike.fetchSession).to.be.called.once
      expect(authorizeProviderLike.authorizePayment).to.be.called.once
      expect(authorizeProviderLike.authorizePayment).to.be.called.with(walletSession)
    })

    it('it should throw an error due to sessionProvider.fetchSession() error', async () => {
      const sessionProviderLike = chai.spy.interface({
        fetchSession: async (): Promise<Session<IApplePaySessionData>> => {
          throw new Error()
        },
      })

      const applePay = await ApplePay.create(
        { sessionProvider: sessionProviderLike },
        {} as ApplePayJS.ApplePayPaymentRequest,
      )

      expect(applePay.start()).to.eventually.throw(Error)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })
  })
})

class ApplePaySessionMock {
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  constructor(version: number, paymentRequest: ApplePayJS.ApplePayPaymentRequest) {}

  supportsVersion: (version: number) => boolean

  applePayCapabilities: (merchantId: string) => Promise<string>

  onvalidatemerchant: (event: ApplePayJS.ApplePayValidateMerchantEvent) => void

  onpaymentauthorized: (event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => void

  begin = () => {
    this.onvalidatemerchant({} as never)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  completeMerchantValidation = (merchantSession: never) => {
    // eslint-disable-next-line
    this.onpaymentauthorized({} as ApplePayJS.ApplePayPaymentAuthorizedEvent)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  completePayment = (result: never) => {}
}
