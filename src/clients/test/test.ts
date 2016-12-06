/// <reference path="../../wallet.d.ts" />
/// <reference path="./test.d.ts" />
import * as endpoints from "../../endpoints";
import { WalletRequestType }  from "../../request-types";


@WalletRequestType("test")
export class TestRequest implements IWalletRequest {
    private _preferredWindowState: IPreferredWindowState;
    
    constructor(
        private data: ITestRequestData,
        options?: IGenericWalletOptions
    ) {
        if (options && options.preferredWindowState) {
            this._preferredWindowState = options.preferredWindowState;
        }
    }

    public initiate(): Promise<any> {
        const form = document.createElement("form");

        form.action = endpoints.epayZero.testClient;
        form.method = "POST";
        form.target = "_self";

        for(let key in this.data) {
            let input = document.createElement("input");

            input.type = "hidden";
            input.name = key;
            input.value = this.data[key];

            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();

        return new Promise((resolve, reject) => {
            // Implement overlay
        });
    }
}