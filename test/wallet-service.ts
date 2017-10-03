// Test framework dependencies
import "mocha";
import * as chai           from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon          from "sinon";

const expect = chai.expect;
chai.use(chaiAsPromised);

// Implementation depencies and mocks
import "isomorphic-fetch";
import * as fetchMock                       from "fetch-mock";
import WalletService                        from "../src/wallet-service";
import { mockGetWalletResponseTransformer } from "./mocks";

describe("Get wallet session", () => {

    it("should eventually return a wallet session response", () => {
        const response = {
            session: {
                data: [{ key: "mock", value: "data" }],
                walletname: "mock",
            },
        };

        const fetchMockFn: typeof fetch = (fetchMock as any).sandbox().mock("*", response);

        const walletService = new WalletService(null, fetchMockFn);

        return expect(walletService.getSession("testSessionId")).to.become(response);
    });

    it("should apply wallet transformations to the wallet session response", () => {
        const response = {
            session: {
                data: [{ key: "mock", value: "data" }],
                walletname: "mock",
            },
        };

        const fetchMockFn: typeof fetch = (fetchMock as any).sandbox().mock("*", response);

        const transformedResponse = {
            session: {
                data: [{ key: "transformedMock", value: "transformedData" }],
                walletname: "transformedMock" as any,
            },
        };

        const getWalletResponseTransformerMock = mockGetWalletResponseTransformer(transformedResponse);

        const walletService = new WalletService(null, fetchMockFn, getWalletResponseTransformerMock);

        return expect(walletService.getSession("testSessionId")).to.become(transformedResponse);
    });

    it("should throw error when wallet type is not provided in the response", () => {
        const response = {
            session: {
                data: [{ key: "mock", value: "data" }],
                walletname: null,
            },
        };

        const fetchMockFn: typeof fetch = (fetchMock as any).sandbox().mock("*", response);

        const walletService = new WalletService(null, fetchMockFn);

        const walletSessionPromise = walletService.getSession("testSessionId");

        return Promise.all([
            expect(walletSessionPromise).to.be.rejected,

            walletSessionPromise.catch(error => {
                expect(error).to.be.instanceOf(TypeError);
                expect(error.message).to.equal(`A wallet name must be supplied!`);
            }),
        ]);
    });

    it("should throw error when response is erroneous", () => {
        const response = {
            session: {
                data: [{ key: "mock", value: "data" }],
                walletname: "mock",
            },
        };

        const fetchMockFn: typeof fetch = (fetchMock as any).sandbox().mock("*", new Response("", { status: 500 }));

        const walletService = new WalletService(null, fetchMockFn);

        const walletSessionPromise = walletService.getSession("testSessionId");

        return Promise.all([
            expect(walletSessionPromise).to.be.rejected,

            walletSessionPromise.catch(error => {
                expect(error).to.be.instanceOf(SyntaxError);
                expect(error.message).to.equal(`Unexpected end of JSON input`);
            }),
        ]);
    });

});
