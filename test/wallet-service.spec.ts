// Test framework dependencies
import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as fetchMock from 'fetch-mock'
import { FetchError } from 'node-fetch'

import { IWalletName } from '../src/wallet'
import WalletService from '../src/wallet-service'

import { mockGetWalletResponseTransformer } from './mocks'

const expect = chai.expect
chai.use(chaiAsPromised)

describe('Get wallet session', () => {
  beforeEach(() => {
    globalThis.VERSION = '1.0.0'
  })

  afterEach(() => fetchMock.restore())

  it('should eventually return a wallet session response', () => {
    const response = {
      session: {
        data: [{ key: 'mock', value: 'data' }],
        walletname: 'mock',
      },
    }

    fetchMock.mock('*', response)

    const walletService = new WalletService({}, fetch)

    return expect(walletService.getSession('testSessionId')).to.become(response)
  })

  it('should apply wallet transformations to the wallet session response', () => {
    const response = {
      session: {
        data: [{ key: 'mock', value: 'data' }],
        walletname: 'mock',
      },
    }

    fetchMock.mock('*', response)

    const transformedResponse = {
      session: {
        data: [{ key: 'transformedMock', value: 'transformedData' }],
        walletname: 'transformedMock' as IWalletName,
      },
    }

    const getWalletResponseTransformerMock = mockGetWalletResponseTransformer(transformedResponse)

    const walletService = new WalletService({}, fetch, getWalletResponseTransformerMock)

    return expect(walletService.getSession('testSessionId')).to.become(transformedResponse)
  })

  it('should throw error when wallet type is not provided in the response', () => {
    const response = {
      session: {
        data: [{ key: 'mock', value: 'data' }],
        walletname: null,
      },
    }

    const requestMock: typeof fetch = fetchMock.sandbox().mock('*', response) as typeof fetch

    const walletService = new WalletService({}, requestMock)

    const walletSessionPromise = walletService.getSession('testSessionId')

    return Promise.all([
      expect(walletSessionPromise).to.be.rejected,

      walletSessionPromise.catch((error) => {
        expect(error).to.be.instanceOf(TypeError)
        expect(error.message).to.equal(`A wallet name must be supplied!`)
      }),
    ])
  })

  it('should throw error when response is erroneous', () => {
    const requestMock: typeof fetch = fetchMock
      .sandbox()
      .mock('https://wallet-v1.api-eu.bambora.com/sessions/testSessionId', '') as typeof fetch

    const walletService = new WalletService({}, requestMock)

    const walletSessionPromise = walletService.getSession('testSessionId')

    return Promise.all([
      expect(walletSessionPromise).to.be.rejected,

      walletSessionPromise.catch((error) => {
        expect(error).to.be.instanceOf(FetchError)
      }),
    ])
  })
})
