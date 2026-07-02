import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import spies from 'chai-spies'

chai.use(chaiAsPromised)

export const expect = chai.expect
export const spy = chai.use(spies).spy
