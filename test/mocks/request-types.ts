import {
    IWalletRequestData,
    IGenericWalletOptions,
    IWalletResult,
}                           from "../../src/wallet";
import getWalletRequestType from "../../src/request-types";
import { IWalletRequest }   from "../../src/wallet";

export function mockGetWalletRequestType(walletResult: IWalletResult): typeof getWalletRequestType {
    return (walletName: string) => {
        return class Mock implements IWalletRequest {
            constructor(data: IWalletRequestData, options?: IGenericWalletOptions) { /*.*/ }

            public initiate(): Promise<IWalletResult> {
                return Promise.resolve(walletResult);
            }
        };
    };
}
