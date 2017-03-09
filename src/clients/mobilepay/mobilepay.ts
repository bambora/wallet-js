/// <reference path="./mobilepay.d.ts" />
import * as endpoints from "../../endpoints";
import { WalletRequestType }  from "../../request-types";


@WalletRequestType("mobilepay")
export class MobilePayRequest implements IWalletRequest {
    private _preferredWindowState: IPreferredWindowState;

    constructor(
        private data: IMobilePayRequestData,
        options?: IGenericWalletOptions
    ) {
        if (options && options.preferredWindowState) {
            this._preferredWindowState = options.preferredWindowState;
        }
    }

    public initiate(): Promise<any> {
        const form = document.createElement("form");

        form.action = endpoints.mobilePay.productionClient;
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
            // Implement mobile pay in overlay
        });
    }
}