/// <reference path="../../wallet.d.ts" />
/// <reference path="./vipps.d.ts" />
import * as fetch            from "isomorphic-fetch";
import * as endpoints        from "../../endpoints";
import { WalletRequestType } from "../../request-types";


@WalletRequestType("vipps")
export class VippsRequest implements IWalletRequest {
    private _preferredWindowState: IPreferredWindowState;

    constructor(
        private data: IVippsRequestData,
        options?: IGenericWalletOptions
    ) {
        if (options && options.preferredWindowState) {
            this._preferredWindowState = options.preferredWindowState;
        }
    }

    public initiate(): Promise<IVippsResult> {
        const { url, method } = this.data;

        if (method === "Redirect") location.href = url;

        function poll(): Promise<IVippsResult> {
            return fetch(url)
                .then<IPollResponse>(response => response.json())
                .then(
                    function onPollCompleted(response) {
                        if (!response || !response.meta)
                            throw new TypeError("No response was returned.");
                            
                        if (!response.meta.result)
                            throw new Error("Something went wrong on the server.");

                        if (response.wait) return poll();

                        return {
                            redirectUrl: response.redirecturl,
                            authorizeResult: response.authorizeresult,
                            parameters: response.parameters
                        };
                    }
                );
        } 

        return poll();
    }
}