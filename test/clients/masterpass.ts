// Test framework dependencies
import "mocha";
import * as chai           from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon          from "sinon";

const expect = chai.expect;
chai.use(chaiAsPromised);

// Implementation depencies and mocks
import { MasterPassRequest } from "../../src/clients/masterpass";

describe("Initiate MasterPass request", () => {

    it("should eventually return a wallet result");

    it("should load MasterPass library if not already loaded");

    // TODO: finish design and implementation of MasterPass tests
});
