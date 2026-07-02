import loadScript from '../src/utils/load-script.ts'

import { expect, spy } from './setup/chai-setup.ts'

describe('Load Script', () => {
  const scriptSrcError = 'https://example.com/errorScript.js'
  let appendChildSpy: ReturnType<typeof spy.on>

  beforeEach(() => {
    document.body.innerHTML = ''

    const appendChild = document.body.appendChild.bind(document.body)
    appendChildSpy = spy.on(document.body, 'appendChild', (node: Node): Node => {
      if ((node as HTMLScriptElement).src === scriptSrcError) {
        node.dispatchEvent(new Event('error'))
      } else {
        node.dispatchEvent(new Event('load'))
      }
      return appendChild(node)
    })
  })

  afterEach(() => {
    spy.restore()
  })

  describe('#load()', () => {
    it('should load script', async () => {
      const scriptSrc = 'https://example.com/script1.js'

      await loadScript.load(scriptSrc)

      expect(appendChildSpy).to.have.been.called.once
      expect(document.scripts.length).to.be.equal(1)
      expect(document.scripts[0].src).to.be.equal(scriptSrc)
    })

    it('should load script with cache hit', async () => {
      const scriptSrc = 'https://example.com/script2.js'

      await loadScript.load(scriptSrc)

      // 2nd call, expect cache hit
      await loadScript.load(scriptSrc)

      expect(appendChildSpy).to.have.been.called.once
      expect(document.scripts.length).to.be.equal(1)
      expect(document.scripts[0].src).to.be.equal(scriptSrc)
    })

    it('should throw an error on failed load', async () => {
      await expect(loadScript.load(scriptSrcError)).to.be.rejectedWith(
        Error,
        /^Unable to load script https:\/\/example\.com\/errorScript\.js$/,
      )
    })
  })
})
