export const walletRequestTypes = {};


export function WalletRequestType(walletName: string) {
    return function(walletRequestClass: Function) {
        walletRequestTypes[walletName] = walletRequestClass;
    }
}