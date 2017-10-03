// Test framework dependencies
import "mocha";
import * as chai           from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon          from "sinon";

const expect = chai.expect;
chai.use(chaiAsPromised);

// Implementation depencies and mocks
import Wallet               from "../src/wallet";
import WalletService        from "../src/wallet-service";
import getWalletRequestType from "../src/request-types";
import {
    mockWalletService,
    mockGetWalletRequestType,
}                           from "./mocks";

describe("Open wallet session", () => {

    it("should eventually return a wallet result", () => {
        const walletServiceMock = mockWalletService({
            session: {
                data       : [{ key : "mock", value: "data" }],
                walletname : "Test",
            },
        });

        const getWalletRequestTypeMock = mockGetWalletRequestType({
            data       : "mock data",
            walletName : "Test",
        });

        const wallet = new Wallet(walletServiceMock, getWalletRequestTypeMock);

        return expect(wallet.open("abcdef")).to.be.eventually.deep.equal({
            data       : "mock data",
            walletName : "Test",
        });
    });

    it("should throw error when wallet type does not exist", () => {
        const walletServiceMock = mockWalletService({
            session: {
                data       : [{ key : "mock", value: "data" }],
                walletname : "Non-existent wallet name" as any,
            },
        });

        const wallet = new Wallet(walletServiceMock);

        const walletResultPromise = wallet.open("abcdef");

        return Promise.all([
            expect(walletResultPromise).to.be.rejected,

            walletResultPromise.catch(error => {
                expect(error).to.be.instanceOf(ReferenceError);
                expect(error.message).to.equal(`The wallet type "non-existent wallet name" could not be found.`);
            }),
        ]);
    });

});
