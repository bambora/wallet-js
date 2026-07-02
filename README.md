# Worldline Online Checkout JavaScript wallet API / library

Implements an abstraction layer over the various wallet integrations offered by Worldline Online Checkout.

Strongly typed. Promise-based.

- Package name: `@bambora/wallet`
- Runtime requirement: Node.js `>=22.22.2`

Currently, the following wallet solutions are supported:

- MobilePay
- Vipps
- Google Pay
- Apple Pay

You will need a merchant account with Worldline Online Checkout to use this library.

## Getting Started

To get started please refer to the documentation on [developer.bambora.com](https://developer.bambora.com/europe/sdk/wallet-sdk/introduction)

## Build

Requirements are _Node.js_ `>=22.22.2` and _npm_.

Clone the project, navigate to the project root, and run the following in your terminal:

```bash
npm install
npm run build
```

This installs dependencies, runs linting, and creates a standard build in `dist/`.

For a development bundle without production optimizations, run:

```bash
npm start
```

To create a production build with `NODE_ENV=production`, run:

```bash
npm run build:production
```

The package build output includes:

- `dist/index.mjs`
- `dist/index.js`
- `dist/wallet.min.js`
- `dist/types/index.d.ts`

### Main developer dependencies

- Rollup
- TypeScript
- Mocha
- Chai

### Test

Run `npm test` in the project root to execute the Mocha test suite.

Additional useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run lint` | Lint source files and tests. |
| `npm run lint:fix` | Auto-fix lint issues where possible. |
| `npm run test:package` | Build, pack, and verify the published package contents in a temporary install. |
| `npm run test:package:clean` | Remove generated `bambora-wallet-*.tgz` files. |

To run the full suite (build, tests, lint, and package verification), use:

```bash
npm run test:all
```

## Contributing

Create a pull request or an issue. Thanks.
