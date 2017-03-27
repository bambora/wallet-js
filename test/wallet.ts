import "mocha";
import * as chai            from "chai";
import * as chaiAsPromised  from "chai-as-promised";
import * as sinon           from "sinon";

const expect = chai.expect;
chai.use(chaiAsPromised);

import { Promise }          from "es6-promise";
import Wallet, {
    IWalletRequestData,
    IGenericWalletOptions,
    IWalletResult,
}                           from "../src/wallet";
import WalletService, {
    IWalletService,
    IWalletServiceConstructable,
    IValidWalletSessionResponse,
}                           from "../src/wallet-service";
import getWalletRequestType from "../src/request-types";
import { IWalletRequest }   from "../src/wallet";

function mockWalletService(response: IValidWalletSessionResponse): IWalletServiceConstructable {
    return class Mock {
        public getSession(sessionId: string): Promise<IValidWalletSessionResponse> {
            return Promise.resolve(response);
        }
    };
}

function mockGetWalletRequestType(walletResult: IWalletResult): typeof getWalletRequestType {
    return (walletName: string) => {
        return class Mock {
            constructor(data: IWalletRequestData, options?: IGenericWalletOptions) { /*.*/ }

            public initiate(): Promise<IWalletResult> {
                return Promise.resolve(walletResult);
            }
        };
    };
}

describe("Open wallet session", () => {

    it("should eventually return a wallet result", () => {
        const walletService = mockWalletService({
            session: {
                data       : [{ key : "mock", value: "data" }],
                walletname : "Test",
            },
        });

        const getWalletRequestType = mockGetWalletRequestType({
            data       : "mock data",
            walletName : "Test",
        });

        const wallet = new Wallet(walletService, getWalletRequestType);

        return expect(wallet.open("abcdef")).to.be.eventually.deep.equal({
            data       : "mock data",
            walletName : "Test",
        });
    });

    it("should throw error when wallet type does not exist", () => {
        const walletService = mockWalletService({
            session: {
                data       : [{ key : "mock", value: "data" }],
                walletname : "Non-existent wallet name" as any,
            },
        });

        const wallet = new Wallet(walletService);

        return Promise.all([
            expect(wallet.open("abcdef")).to.be.rejected,

            wallet.open("abcdef").catch(error => {
                expect(error instanceof ReferenceError).to.be.true;
                expect(error.message).to.equal(`The wallet type "non-existent wallet name" could not be found.`);
            }),
        ]);
    });

});
