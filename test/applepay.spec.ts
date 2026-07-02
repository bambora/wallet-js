import ApplePay from '../src/clients/applepay.ts'
import loadScript from '../src/utils/load-script.ts'

import { expect, spy } from './setup/chai-setup.ts'

import type { ButtonOptions, IApplePayCallbackResponse, IApplePaySessionData } from '../src/clients/applepay.ts'
import type { Session } from '../src/wallet'

describe('Apple Pay', () => {
  let loadScriptSpy: ReturnType<typeof spy.on>

  beforeEach(() => {
    window.ApplePaySession = ApplePaySessionMock as never

    loadScriptSpy = spy.on(loadScript, 'load', () => {})
  })

  afterEach(() => {
    spy.restore()
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
      expect(loadScriptSpy).to.have.been.called.with('https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js')
    })

    it('should throw an error due to missing configuration', async () => {
      await expect(ApplePay.create(undefined as never, undefined as never)).to.be.rejectedWith(
        Error,
        /^Configuration must be provided$/,
      )
    })

    it('should throw an error due to missing sessionProvider on configuration', async () => {
      const configuration = {
        sessionProvider: undefined,
      }
      await expect(ApplePay.create({} as never, configuration as never)).to.be.rejectedWith(
        Error,
        /^Configuration sessionProvider must be implemented$/,
      )
    })
  })

  describe('#isAvailable()', () => {
    ;[
      { applePaySession: false, supportsVersion: false, canMakePayments: false, expected: false },
      { applePaySession: true, supportsVersion: false, canMakePayments: false, expected: false },
      { applePaySession: true, supportsVersion: true, canMakePayments: false, expected: false },
      { applePaySession: true, supportsVersion: true, canMakePayments: true, expected: true },
    ].forEach((data) => {
      it('should check isAvailable() on Apple Pay wallet', async () => {
        const supportsVersionSpy = spy.on(
          window.ApplePaySession,
          'supportsVersion',
          (): boolean => data.supportsVersion,
        )

        const canMakePaymentsSpy = spy.on(
          window.ApplePaySession,
          'canMakePayments',
          () => new Promise((resolve) => resolve(data.canMakePayments)),
        )

        window.ApplePaySession = (data.applePaySession ? window.ApplePaySession : undefined) as never

        const applePay = await ApplePay.create(
          {
            sessionProvider: {} as never,
            clientConfiguration: {} as never,
          },
          {} as never,
        )

        const result = await applePay.isAvailable()

        expect(result).to.be.equal(data.expected)
        if (!data.applePaySession) {
          expect(window.ApplePaySession).to.be.undefined
        }
        expect(supportsVersionSpy).to.be.called.exactly(data.applePaySession ? 1 : 0)
        expect(canMakePaymentsSpy).to.be.called.exactly(data.applePaySession && data.supportsVersion ? 1 : 0)
      })
    })
  })

  describe('#isCapable()', () => {
    it('should check isCapable() on Apple Pay wallet', async () => {
      const merchantId = 'merchantId123'

      const supportsVersionSpy = spy.on(window.ApplePaySession, 'supportsVersion', (): boolean => true)

      const applePayCapabilitiesSpy = spy.on(
        window.ApplePaySession,
        'applePayCapabilities',
        () => new Promise((resolve) => resolve({ paymentCredentialStatus: 'paymentCredentialsAvailable' })),
      )

      const applePay = await ApplePay.create(
        {
          sessionProvider: {} as never,
          clientConfiguration: { merchantId },
        },
        {} as never,
      )

      const result = await applePay.isCapable()

      expect(result).to.be.equal('paymentCredentialsAvailable')
      expect(supportsVersionSpy).to.be.called.once
      expect(supportsVersionSpy).to.be.called.with(3)
      expect(applePayCapabilitiesSpy).to.be.called.once
      expect(applePayCapabilitiesSpy).to.be.called.with(merchantId)
    })
    ;[
      { applePaySession: false, supportsVersion: false, merchantId: undefined },
      { applePaySession: true, supportsVersion: false, merchantId: '' },
    ].forEach((data) => {
      it('should throw an error due to ApplePaySession not available', async () => {
        const supportsVersionSpy = spy.on(
          window.ApplePaySession,
          'supportsVersion',
          (): boolean => data.supportsVersion,
        )

        const applePayCapabilitiesSpy = spy.on(window.ApplePaySession, 'applePayCapabilities')

        window.ApplePaySession = (data.applePaySession ? window.ApplePaySession : undefined) as never

        const applePay = await ApplePay.create(
          {
            sessionProvider: {} as never,
            clientConfiguration: {} as never,
          },
          {} as never,
        )

        await expect(applePay.isCapable()).to.be.rejectedWith(Error, /^ApplePaySession not available$/)

        if (!data.applePaySession) {
          expect(window.ApplePaySession).to.be.undefined
        }
        expect(supportsVersionSpy).to.be.called.exactly(data.applePaySession ? 1 : 0)
        expect(applePayCapabilitiesSpy).to.not.be.called
      })
    })
  })

  describe('#createButton()', () => {
    it('should add Apple Pay button to container', async () => {
      const applePay = await ApplePay.create({ sessionProvider: {} as never }, {} as never)

      const buttonOptions: ButtonOptions = {
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
      const sessionProviderLike = spy.interface({
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
      const authorizeProviderLike = spy.interface({
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
      expect(authorizeProviderLike.authorizePayment).to.called.with(walletSession)
    })

    it('it should throw an error due to sessionProvider.fetchSession() error', async () => {
      const sessionProviderLike = spy.interface({
        fetchSession: async (): Promise<Session<IApplePaySessionData>> => {
          throw new Error()
        },
      })

      const applePay = await ApplePay.create(
        { sessionProvider: sessionProviderLike },
        {} as ApplePayJS.ApplePayPaymentRequest,
      )

      await expect(applePay.start()).to.be.rejectedWith(Error)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })
  })
})

class ApplePaySessionMock {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(version: number, paymentRequest: ApplePayJS.ApplePayPaymentRequest) {}

  onvalidatemerchant!: (event: ApplePayJS.ApplePayValidateMerchantEvent) => void

  onpaymentauthorized!: (event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => void

  begin = () => {
    this.onvalidatemerchant({} as never)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  completeMerchantValidation = (merchantSession: never) => {
    this.onpaymentauthorized({} as ApplePayJS.ApplePayPaymentAuthorizedEvent)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  completePayment = (result: never) => {}

  abort = () => {}
}
