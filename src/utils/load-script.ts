let cachedScripts: Record<string, Promise<void>> = {}

const loadScript = {
  load: (src: string): Promise<void> => {
    const existing = cachedScripts[src]
    if (existing) {
      return existing
    }

    const promise = new Promise<void>((resolve, reject) => {
      // Create script
      const script = document.createElement('script')
      script.src = src
      script.async = true

      // Script event listener callbacks for load and error
      const onScriptLoad = (): void => {
        cleanup()
        resolve()
      }

      const onScriptError = (): void => {
        cleanup()

        // Remove from cachedScripts so that we can try loading again
        delete cachedScripts[src]
        script.remove()

        reject(new Error(`Unable to load script ${src}`))
      }

      script.addEventListener('load', onScriptLoad)
      script.addEventListener('error', onScriptError)

      // Add script to document body
      document.body.appendChild(script)

      // Remove event listeners on cleanup
      function cleanup(): void {
        script.removeEventListener('load', onScriptLoad)
        script.removeEventListener('error', onScriptError)
      }
    })

    cachedScripts[src] = promise

    return promise
  },
}

export default loadScript
