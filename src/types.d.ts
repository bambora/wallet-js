export {}

declare global {
  interface Window {
    ApplePaySession: typeof ApplePaySession & {
      applePayCapabilities: (merchantId: string) => Promise<{
        paymentCredentialStatus:
          | 'paymentCredentialStatusAvailable'
          | 'paymentCredentialStatusUnknown'
          | 'paymentCredentialsUnavailable'
          | 'applePayUnsupported'
      }>
    }
  }
}
