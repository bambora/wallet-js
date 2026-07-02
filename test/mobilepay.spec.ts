import MobilePay from '../src/clients/mobilepay.ts'

import { expect, spy } from './setup/chai-setup.ts'

import type { IMobilePaySessionData } from '../src/clients/mobilepay.ts'
import type { Session } from '../src/wallet'

describe('MobilePay', () => {
  beforeEach(() => {
    window = (window && { location: { href: '' } as Location }) as Window & typeof globalThis
  })

  describe('#create()', () => {
    it('should return a MobilePay wallet', () => {
      const configuration = {
        sessionProvider: {} as never,
      }

      expect(MobilePay.create(configuration)).to.be.instanceOf(MobilePay)
    })

    it('should throw an error due to missing configuration', () => {
      expect(() => MobilePay.create(undefined as never)).to.throw(Error, /^Configuration must be provided$/)
    })

    it('should throw an error due to missing sessionProvider on configuration', () => {
      const configuration = {
        sessionProvider: undefined,
      }
      expect(() => MobilePay.create(configuration as never)).to.throw(
        Error,
        /^Configuration sessionProvider must be implemented$/,
      )
    })
  })

  describe('#start()', () => {
    it('should start a MobilePay session', async () => {
      const walletSession: Session<IMobilePaySessionData> = { data: { Url: 'https://mobilepay.com' } }
      const sessionProviderLike = spy.interface({
        fetchSession: async (): Promise<Session<IMobilePaySessionData>> => walletSession,
      })

      const mobilePay = MobilePay.create({ sessionProvider: sessionProviderLike }, { target: '_self' })

      await mobilePay.start()

      console.warn(window.location.href)
      expect(window.location.href).to.be.eq(walletSession.data.Url)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })

    it('should throw an error on fetchSession failure', async () => {
      const error = new Error()
      const sessionProviderLike = spy.interface({
        fetchSession: async (): Promise<Session<IMobilePaySessionData>> => {
          throw error
        },
      })

      const mobilePay = MobilePay.create({ sessionProvider: sessionProviderLike })

      await expect(mobilePay.start()).to.be.rejectedWith(error)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })
  })
})
