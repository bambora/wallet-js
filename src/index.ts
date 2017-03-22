import Wallet from "./wallet";

if(window) {
    window.Bambora        = window.Bambora        || {};
    window.Bambora.Wallet = window.Bambora.Wallet || Wallet;
}

// Browser
declare global {
    module Bambora {
        const Wallet: IWalletConstructable;
    }

    interface Window {
        Bambora: {
            Wallet?: IWalletConstructable;
        };
    }
}

export interface IWalletConstructable {
    new(): Wallet;
}

export default Wallet;