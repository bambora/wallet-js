# wallet
Bambora Online JavaScript Wallet API


Wallets are initiated as follows:

```javascript
const wallet = new Bambora.Wallet();

wallet.open("a1b2c3d4e5f6", options)
   .then(function onFulfilled(response) => {
         // success handler
      })
   .catch(function onRejected(error) => {
         // failure/cancel handler
      });
```