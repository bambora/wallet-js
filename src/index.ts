import Wallet from "./wallet";

if (window) {
    window.Bambora        = window.Bambora        || {};
    window.Bambora.Wallet = window.Bambora.Wallet || Wallet;
}

// Browser
// tslint:disable
declare global {
    interface Bambora {
        Wallet: IWalletConstructable;
    }

    interface Window {
        Bambora: {
            Wallet?: IWalletConstructable;
        };
    }
}
// tslint:enable

export interface IWalletConstructable {
    new(): Wallet;
}

export default Wallet;
