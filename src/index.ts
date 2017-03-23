import Wallet, { IConstructable } from "./wallet";

if (window) {
    window.Bambora        = window.Bambora        || {};
    window.Bambora.Wallet = window.Bambora.Wallet || Wallet;
}

// Browser
// tslint:disable
declare global {
    interface Bambora {
        Wallet: IConstructable<Wallet>;
    }
}
// tslint:enable

export interface IWalletConstructable {
    new(): Wallet;
}

export default Wallet;
