# Worldline Online Checkout JavaScript wallet API / library

Implements an abstraction layer over the various wallet integrations offered by Worldline Online Checkout.

Strongly typed. Promise-based.

Currently, the following wallet solutions are supported:

- MobilePay
- Vipps
- Google Pay

You will need a merchant account with Worldline Online Checkout to use this library.

## Getting Started

To get started please refer to the documentation on [developer.bambora.com](https://developer.bambora.com/europe/sdk/wallet-sdk/introduction)

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

## CI/CD

CI/CD is done by Jenkins by reading the Jenkinsfile. The CI/CD pipeline goes through 4 steps:

1. Build.
2. Publish to Bambora CDN (files are uploaded to S3).
3. Invalidate Bambora CDN Cache (the cache on CloudFront is invalidated).
4. Publish to public NPM.

This will be run on the master branch and with tagged commits only.

Use `npm version` to bump the version and create a tagged commit as it ensures consistency.
