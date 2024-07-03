import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { Session } from '../src/wallet';
import MobilePay, { IMobilePaySessionData } from '../src/clients/mobilepay.ts'

const expect = chai.expect
chai.use(chaiAsPromised)

declare global {
  namespace NodeJS {
    interface Global {
      window: any;
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
        sessionProvider: {} as any
      }

      expect(MobilePay.create(configuration)).to.be.instanceOf(MobilePay)
    })

    it('should throw an error due to missing configuration', () => {
      expect(() => MobilePay.create(undefined as any)).to.throw(Error, 'Configuration must be provided')
    })

    it('should throw an error due to missing sessionProvider on configuration', () => {
      const configuration = {
        sessionProvider: undefined
      }
      expect(() => MobilePay.create(configuration as any)).to.throw(Error, 'Configuration sessionProvider must be implemented')
    })
  })

  describe('#start()', () => {
    it('should start a MobilePay session', async () => {
      const walletSession: Session<IMobilePaySessionData> = { data: { Url: 'https://mobilepay.com' } }
      const sessionProviderLike = chai.spy.interface({
        fetchSession: async (): Promise<Session<IMobilePaySessionData>> => walletSession
      })

      const mobilePay = MobilePay.create({ sessionProvider: sessionProviderLike })

      await mobilePay.start();

      expect(global.window.location.href).to.be.eq(walletSession.data.Url)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })

    it('should throw an error on fetchSession failure', async () => {
      const error = new Error()
      const sessionProviderLike = chai.spy.interface({
        fetchSession: async (): Promise<Session<IMobilePaySessionData>> => { throw error }
      })

      const mobilePay = MobilePay.create({ sessionProvider: sessionProviderLike })

      expect(mobilePay.start()).to.eventually.throw(error)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })
  })
})
