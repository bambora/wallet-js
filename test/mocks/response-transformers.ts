import {
    IWalletSessionResponse,
    IValidWalletSessionResponse,
} from "../../src/wallet-service";
import getWalletResponseTransformer, {
    IWalletResponseTransformer,
} from "../../src/response-transformers";

export function mockGetWalletResponseTransformer(
    validWalletSessionResponse: IValidWalletSessionResponse,
): typeof getWalletResponseTransformer {
    return (walletName: string): IWalletResponseTransformer => {
        return {
            transform: (response: IWalletSessionResponse): IValidWalletSessionResponse => {
                return validWalletSessionResponse;
            },
        };
    };
}
