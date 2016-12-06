export const walletResponseTransformers = {};


export function getWalletResponseTransformer(walletName: string): IWalletResponseTransformer {
    if(walletResponseTransformers[walletName]) return new walletResponseTransformers[walletName]();
    return null;
}


// Decorator
export function WalletResponseTransformer(walletName: string) {
    return function(walletTransformerConstructable: IWalletResponseTransformerConstructable) {
        walletResponseTransformers[walletName] = walletTransformerConstructable;
    }
}