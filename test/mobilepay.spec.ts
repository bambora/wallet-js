import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'

import MobilePay, { IMobilePaySessionData } from '../src/clients/mobilepay.ts'
import { Session } from '../src/wallet'

const expect = chai.expect
chai.use(chaiAsPromised)

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window: any
    }
  }
}

describe('MobilePay', () => {
  beforeEach(() => {
    global.window = { location: { href: undefined } }
  })

  describe('#create()', () => {
    it('should return a MobilePay wallet', () => {
      const configuration = {
        sessionProvider: {} as never,
      }

      expect(MobilePay.create(configuration)).to.be.instanceOf(MobilePay)
    })

    it('should throw an error due to missing configuration', () => {
      expect(() => MobilePay.create(undefined as never)).to.throw(Error, 'Configuration must be provided')
    })

    it('should throw an error due to missing sessionProvider on configuration', () => {
      const configuration = {
        sessionProvider: undefined,
      }
      expect(() => MobilePay.create(configuration as never)).to.throw(
        Error,
        'Configuration sessionProvider must be implemented',
      )
    })
  })

  describe('#start()', () => {
    it('should start a MobilePay session', async () => {
      const walletSession: Session<IMobilePaySessionData> = { data: { Url: 'https://mobilepay.com' } }
      const sessionProviderLike = chai.spy.interface({
        fetchSession: async (): Promise<Session<IMobilePaySessionData>> => walletSession,
      })

      const mobilePay = MobilePay.create({ sessionProvider: sessionProviderLike })

      await mobilePay.start()

      expect(global.window.location.href).to.be.eq(walletSession.data.Url)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })

    it('should throw an error on fetchSession failure', async () => {
      const error = new Error()
      const sessionProviderLike = chai.spy.interface({
        fetchSession: async (): Promise<Session<IMobilePaySessionData>> => {
          throw error
        },
      })

      const mobilePay = MobilePay.create({ sessionProvider: sessionProviderLike })

      expect(mobilePay.start()).to.eventually.throw(error)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })
  })
})
