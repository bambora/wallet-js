import {
    IWalletService,
    IWalletServiceConstructable,
    IValidWalletSessionResponse,
}                  from "../../src/wallet-service";

export function mockWalletService(response: IValidWalletSessionResponse): any {
    return class Mock {
        public getSession(sessionId: string): Promise<IValidWalletSessionResponse> {
            return Promise.resolve(response);
        }
    };
}
