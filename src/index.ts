import * as promise from "es6-promise";
promise.polyfill();
import "whatwg-fetch";

import Wallet from "./wallet";
import * as errors from "./errors";

if (window) {
    window.Bambora              = window.Bambora        || {};
    window.Bambora.Wallet       = window.Bambora.Wallet || Wallet;
    window.Bambora.WalletErrors = window.Bambora.WalletErrors || errors;
}

// tslint:disable
declare global {
    interface Bambora {
        Wallet?: typeof Wallet;
        WalletErrors?: typeof errors;
    }

    interface Window {
        Bambora: Bambora;
    }
}
// tslint:enable

export default Wallet;
export { errors };
