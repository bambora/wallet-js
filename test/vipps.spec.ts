import * as chai from 'chai'

import Vipps from '../src/clients/vipps.ts'

import { spy } from './setup/chai-setup.ts'

import type { IVippsSessionData } from '../src/clients/vipps.ts'
import type { Session } from '../src/wallet'

const expect = chai.expect

describe('Vipps', () => {
  beforeEach(() => {
    window = (window && { location: { href: '' } as Location }) as Window & typeof globalThis
  })

  describe('#create()', () => {
    it('should return a Vipps wallet', () => {
      const configuration = {
        sessionProvider: {} as never,
      }

      expect(Vipps.create(configuration)).to.be.instanceOf(Vipps)
    })

    it('should throw an error due to missing configuration', () => {
      expect(() => Vipps.create(undefined as never)).to.throw(Error, /^Configuration must be provided$/)
    })

    it('should throw an error due to missing sessionProvider on configuration', () => {
      const configuration = {
        sessionProvider: undefined,
      }
      expect(() => Vipps.create(configuration as never)).to.throw(
        Error,
        /^Configuration sessionProvider must be implemented$/,
      )
    })
  })

  describe('#start()', () => {
    it('should start a Vipps session', async () => {
      const walletSession: Session<IVippsSessionData> = { data: { url: 'https://vipps.com' } }
      const sessionProviderLike = spy.interface({
        fetchSession: async (): Promise<Session<IVippsSessionData>> => walletSession,
      })

      const vipps = Vipps.create({ sessionProvider: sessionProviderLike }, { target: '_self' })

      await vipps.start()

      expect(window.location.href).to.be.equal(walletSession.data.url)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })

    it('should throw an error on fetchSession failure', async () => {
      const error = new Error()
      const sessionProviderLike = spy.interface({
        fetchSession: async (): Promise<Session<IVippsSessionData>> => {
          throw error
        },
      })

      const vipps = Vipps.create({ sessionProvider: sessionProviderLike })

      await expect(vipps.start()).to.be.rejectedWith(error)
      expect(sessionProviderLike.fetchSession).to.be.called.once
    })
  })
})
