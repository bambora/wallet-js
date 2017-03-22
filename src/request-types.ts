import { IWalletRequestData, IGenericWalletOptions, IWalletRequest } from "./wallet";

export interface IWalletRequestConstructable {
    new(data: IWalletRequestData, options?: IGenericWalletOptions): IWalletRequest;
}

export const walletRequestTypes = {};

export default function getWalletRequestType(walletName: string): IWalletRequestConstructable {
    if (typeof walletName !== "string" || !walletName.length)
        throw new TypeError("A wallet name must be supplied!");

    walletName = walletName.toLowerCase();

    if(walletRequestTypes[walletName])
        return walletRequestTypes[walletName];

    throw new ReferenceError(`The wallet type "${walletName}" could not be found.`);
}

// Decorator
export function WalletRequestType(walletName: string) {
    if (typeof walletName !== "string" || !walletName.length)
        throw new TypeError("A wallet name must be supplied!");

    walletName = walletName.toLowerCase();

    return function(walletRequestConstructable: IWalletRequestConstructable) {
        walletRequestTypes[walletName] = walletRequestConstructable;
    }
}

// Get the clients
import * as clients from "./clients";
clients;