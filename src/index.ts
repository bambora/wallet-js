import Wallet from "./wallet";

if (window) {
    window.Bambora        = window.Bambora        || {};
    window.Bambora.Wallet = window.Bambora.Wallet || Wallet;
}

// tslint:disable
declare global {
    interface Bambora {
        Wallet?: typeof Wallet;
    }

    interface Window {
        Bambora: Bambora;
    }
}
// tslint:enable

export default Wallet;
