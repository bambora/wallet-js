// Test framework dependencies
import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'

const expect = chai.expect
chai.use(chaiAsPromised)

// Implementation dependencies and mocks
import getWalletResponseTransformer, { WalletResponseTransformer } from '../src/response-transformers'
import { IValidWalletSessionResponse } from '../src/wallet-service'

describe('Response transformer decorator', () => {
  it('should register wallet response transformers', () => {
    @WalletResponseTransformer('mockTransformer')
    class MockTransformer {
      public transform(): IValidWalletSessionResponse {
        return {} as never
      }
    }

    const mockTransformer = getWalletResponseTransformer('mockTransformer')

    expect(mockTransformer).to.deep.equal(new MockTransformer())
  })

  it('should throw an error if no wallet name is provided', () => {
    const registerResponseTransformer = () =>
      WalletResponseTransformer('')(
        class MockTransformer {
          public transform(): IValidWalletSessionResponse {
            return {} as never
          }
        },
      )

    expect(registerResponseTransformer).to.throw(TypeError, 'A wallet name must be supplied!')
  })
})

describe('Response transformer retriever', () => {
  it('should retrieve a registered wallet response transformer', () => {
    @WalletResponseTransformer('mockTransformer')
    class MockTransformer {
      public transform(): IValidWalletSessionResponse {
        return {} as never
      }
    }

    const mockTransformer = getWalletResponseTransformer('mockTransformer')

    expect(mockTransformer).to.deep.equal(new MockTransformer())
  })

  it('should throw an error if no wallet name is provided', () => {
    expect(() => getWalletResponseTransformer('')).to.throw(TypeError, 'A wallet name must be supplied!')
  })

  it('should return null if no wallet response trasformer was found', () => {
    const mockTransformer = getWalletResponseTransformer('transformerThatDoesNotExist')

    expect(mockTransformer).to.equal(null)
  })
})
