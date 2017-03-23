import { IWalletSessionResponse, IValidWalletSessionResponse } from "./wallet-service";

export interface IWalletResponseTransformerConstructable {
    new(): IWalletResponseTransformer;
}

export interface IWalletResponseTransformer {
    transform(response: IWalletSessionResponse): IValidWalletSessionResponse;
}

export const walletResponseTransformers = {};

export default function getWalletResponseTransformer(walletName: string): IWalletResponseTransformer {
    if (typeof walletName !== "string" || !walletName.length)
        throw new TypeError("A wallet name must be supplied!");

    walletName = walletName.toLowerCase();

    if (walletResponseTransformers[walletName])
        return new walletResponseTransformers[walletName]();

    // Otherwise just do nothing
    return null;
}

// Decorator
export function WalletResponseTransformer(walletName: string) {
    if (typeof walletName !== "string" || !walletName.length)
        throw new TypeError("A wallet name must be supplied!");

    walletName = walletName.toLowerCase();

    return function(walletTransformerConstructable: IWalletResponseTransformerConstructable) {
        walletResponseTransformers[walletName] = walletTransformerConstructable;
    };
};
