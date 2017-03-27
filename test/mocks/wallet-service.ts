import { Promise } from "es6-promise";
import {
    IWalletService,
    IWalletServiceConstructable,
    IValidWalletSessionResponse,
}                  from "../../src/wallet-service";

export function mockWalletService(response: IValidWalletSessionResponse): IWalletServiceConstructable {
    return class Mock implements IWalletService {
        public getSession(sessionId: string): Promise<IValidWalletSessionResponse> {
            return Promise.resolve(response);
        }
    };
}
