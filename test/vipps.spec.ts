import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'

import Vipps, { IVippsSessionData } from '../src/clients/vipps.ts'
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

describe('Vipps', () => {
  beforeEach(() => {
    global.window = { location: { href: undefined } }
  })

  describe('#create()', () => {
    it('should return a Vipps wallet', () => {
      const configuration = {
        sessionProvider: {} as never,
      }

      expect(Vipps.create(configuration)).to.be.instanceOf(Vipps)
    })

    it('should throw an error due to missing configuration', () => {
      expect(() => Vipps.create(undefined as never)).to.throw(Error, 'Configuration must be provided')
    })

    it('should throw an error due to missing sessionProvider on configuration', () => {
      const configuration = {
        sessionProvider: undefined,
      }
      expect(() => Vipps.create(configuration as never)).to.throw(
        Error,
        'Configuration sessionProvider must be implemented',
      )
    })
  })

  describe('#start()', () => {
    it('should start a Vipps session', async () => {
      const walletSession: Session<IVippsSessionData> = { data: { url: 'https://vipps.com' } }
      const sessionProviderLike = chai.spy.interface({
        fetchSession: async (): Promise<Session<IVippsSessionData>> => walletSession,
      })

      const vipps = Vipps.create({ sessionProvider: sessionProviderLike })

      await vipps.start()

      expect(global.window.location.href).to.be.equal(walletSession.data.url)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })

    it('should throw an error on fetchSession failure', async () => {
      const error = new Error()
      const sessionProviderLike = chai.spy.interface({
        fetchSession: async (): Promise<Session<IVippsSessionData>> => {
          throw error
        },
      })

      const vipps = Vipps.create({ sessionProvider: sessionProviderLike })

      expect(vipps.start()).to.eventually.throw(error)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })
  })
})
