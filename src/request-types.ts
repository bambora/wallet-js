import { IWalletRequestConstructable } from "./wallet";

export const walletRequestTypes = {};

export function getWalletRequestType(walletName: string): IWalletRequestConstructable {
    if(walletRequestTypes[walletName]) return walletRequestTypes[walletName];

    throw new ReferenceError(`The wallet type "${walletName}" could not be found.`);
}


// Decorator
export function WalletRequestType(walletName: string) {
    return function(walletRequestConstructable: IWalletRequestConstructable) {
        walletRequestTypes[walletName] = walletRequestConstructable;
    }
}