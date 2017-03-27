// Test framework dependencies
import "mocha";
import * as chai           from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon          from "sinon";

const expect = chai.expect;
chai.use(chaiAsPromised);

// Implementation depencies and mocks
import "isomorphic-fetch";
import * as fetchMock   from "fetch-mock";
import { EventEmitter } from "eventemitter3";
import {
    VippsRequest,
    IPollResponse,
}                       from "../../src/clients/vipps";

describe("Initiate Vipps request", () => {

    it("should eventually return a wallet result", () => {
        const response: IPollResponse = {
            authorizeresult: true,
            meta: {
                action: {
                    code   : null,
                    source : null,
                    type   : null,
                },
                message: {
                    enduser  : null,
                    merchant : null,
                },
                paging: {
                    itemsreturned    : null,
                    lastevaluatedkey : null,
                },
                result: true,
            },
            parameters  : null,
            redirecturl : "http://www.example.com",
            wait        : false,
        };

        const fetchMockFn: typeof fetch = (fetchMock as any).sandbox().mock("*", response);

        const request = new VippsRequest(
            { method: "Poll", url: "http://www.example.com" },
            { events: new EventEmitter() },
            fetchMockFn,
        );

        const walletResultPromise = request.initiate();

        expect(walletResultPromise).to.eventually.deep.equal(response);
    });

    it("should retry polling when response wait property is true");

    it("should throw an error when the authorization is rejected");

    it("should throw an error when exceeding maximum retry amount");

    it("should throw an error when no or faulty response was returned");

});
