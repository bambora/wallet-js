# Bambora Online JavaScript wallet API / library

Implements an abstraction layer over the various wallet integrations offered by Bambora Online.

Currently, the following wallet solutions have been implemented:
- MasterPass
- MobilePay
- Vipps
- Bambora Online test wallet

## Installation

**NPM:** `npm install @bambora/wallet`

**CDN:** tba.

Strongly typed. Promise-based.

Minified and gzipped size is ~9 KB.

Browser support: tba.

## Quick start
### Global approach
Include `dist/index.js` on your page.
The `Wallet` constructor function is now accessible on window via `Bambora.Wallet`.

### Modular approach
**ES5:** `var Wallet = require("@bambora/wallet");`

**TS/ES6:** `import Wallet from "@bambora/wallet;`

### Integration
Wallets are initiated as follows:

```javascript
const wallet = new Bambora.Wallet();

wallet.open("input session token here").then(
  function onFulfilled(response) => {
    // Success handler.
    // Enters on successful payment.
  },
  function onRejected(error) => {
    // Failure/cancel handler.
    // Enters on error or rejected payment.
  }
);
```

Or a one-liner:
```javascript
new Bambora.Wallet().open("input session token here").then(successHandler, errorHandler);
```

The `open` method is a function that returns a `promise`.
It resolves when a payment was successfully authorized, and rejects when an exception occurs or the payment was rejected.

### Options Object
**_Info coming soon._**

### Exceptions
**_Info coming soon._**

### Event Emitter
An event emitter is exposed on all Vipps Wallet instances. Subscribe to the event emitter to get updates from each polling request.

```javascript
new Bambora.Wallet().events.on("event type", event => { /* handle event */ })
```

Event types are:
- `pollRequestInitiated`
- `pollRequestFulfilled`

**_Event data info coming soon._**

## Build
Requirements are _Node_ and _NPM_.

Clone the project, navigate to the project root, and run `npm run build` in your terminal.
This will install all dependencies and output all assets to the `dist`-folder.

### Main developer dependencies
- Webpack
- TypeScript
- Mocha
- Chai
- Sinon

### Test
Run `npm test` in your terminal in the project root.

## Contributing
Create a pull request or an issue. Thanks.

**_More info coming soon._**

## Maintainers
Currently maintained by Jesper Dalgas Zachariassen.

Contact via `jesper.zachariassen@bambora.com` or `@jesperzach` on the Bambora Slack.