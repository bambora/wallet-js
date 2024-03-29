// Test framework dependencies
import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'

const expect = chai.expect
chai.use(chaiAsPromised)

// Implementation depencies and mocks
import getWalletRequestType, { WalletRequestType } from '../src/request-types'
import { IWalletResult } from '../src/wallet'

describe('Request type decorator', () => {
  it('should register wallet request types', () => {
    @WalletRequestType('mockRequestType')
    class MockRequestType {
      public initiate(): Promise<IWalletResult> {
        return Promise.resolve<IWalletResult>({
          data: null,
          walletName: 'mockWallet' as unknown,
        } as IWalletResult)
      }
    }

    const mockRequestType = getWalletRequestType('mockRequestType')

    expect(mockRequestType).to.equal(MockRequestType)
  })

  it('should throw an error if no wallet name is provided', () => {
    const registerRequestType = () =>
      WalletRequestType('')(
        class MockRequestType {
          public initiate(): Promise<IWalletResult> {
            return Promise.resolve<IWalletResult>({
              data: null,
              walletName: 'mockWallet' as unknown,
            } as IWalletResult)
          }
        },
      )

    expect(registerRequestType).to.throw(TypeError, 'A wallet name must be supplied!')
  })
})

describe('Request type retriever', () => {
  it('should retrieve a registered wallet request type', () => {
    @WalletRequestType('mockRequestType')
    class MockRequestType {
      public initiate(): Promise<IWalletResult> {
        return Promise.resolve<IWalletResult>({
          data: null,
          walletName: 'mockWallet' as unknown,
        } as IWalletResult)
      }
    }

    const mockRequestType = getWalletRequestType('mockRequestType')

    expect(mockRequestType).to.equal(MockRequestType)
  })

  it('should throw an error if no wallet name is provided', () => {
    expect(() => getWalletRequestType('')).to.throw(TypeError, 'A wallet name must be supplied!')
  })

  it('should throw an error if the wallet name does not exist', () => {
    expect(() => getWalletRequestType('nonExistentRequestType')).to.throw(
      ReferenceError,
      `The wallet type "nonExistentRequestType" could not be found.`,
    )
  })
})
