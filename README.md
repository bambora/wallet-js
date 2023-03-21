# Bambora Online JavaScript wallet API / library

Implements an abstraction layer over the various wallet integrations offered by Bambora Online.

Strongly typed. Promise-based.

Currently, the following wallet solutions are supported:

- MobilePay
- Vipps
- Bambora Online test wallet

You will need a merchant account with Bambora Online to use this library.

If you're looking for documentation for the wallet API it can be found [here](https://developer.bambora.com/europe/checkout/api-reference/wallet).

## Installation

**NPM:** `npm install @bambora/wallet`

**CDN:** <https://static.bambora.com/wallet/v2/latest/wallet.min.js>

Minified and gzipped size is ~9 KB.

**Browser support:**
All major browsers above version `N - 1`, where N is the most recent version.
For Internet Explorer, only version 11 is supported.
Pull requests for bugs related to older versions or uncommon browsers are welcome, but not supported by Bambora.

## Quick start

### Global approach

Include the following snippet on your page just before the `</body>` tag:

```javascript
<script type="text/javascript" src="https://static.bambora.com/wallet/latest/wallet.min.js"></script>
```

The `Wallet` constructor function will then be accessible on window via `Bambora.Wallet`:

```javascript
document.addEventListener("DOMContentLoaded", function() {
  // ...
  var wallet = new Bambora.Wallet();
  // ...
}, false);
```

### Modular approach

**ES5:** `var Wallet = require("@bambora/wallet");`

**TS/ES6:** `import Wallet from "@bambora/wallet";`

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

## Build

Requirements are _Node_ and _NPM_.

Clone the project, navigate to the project root, and run `npm run build` in your terminal.
This will install all dependencies and output all assets to the `dist`-folder.

### Main developer dependencies

- Webpack
- TypeScript
- Mocha
- Chai

### Test

Run `npm test` in your terminal in the project root.

## Contributing

Create a pull request or an issue. Thanks.

**_More info coming soon._**

## CI/CD

CI/CD is done by Jenkins by reading the Jenkinsfile. The CI/CD pipeline goes through 4 steps:

1. Build.
2. Publish to Bambora CDN (files are uploaded to S3).
3. Invalidate Bambora CDN Cache (the cache on CloudFront is invalidated).
4. Publish to public NPM.

This will be run on the master branch and with tagged commits only.

Use `npm version` to bump the version and create a tagged commit as it ensures consistency.
