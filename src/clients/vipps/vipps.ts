import { Promise }                                                                                         from "es6-promise";
import * as fetch                                                                                          from "isomorphic-fetch";
import { EventEmitter }                                                                                    from "eventemitter3";
import { AuthorizationError, ConnectionError, NoResponseError }                                            from "../../errors";
import * as endpoints                                                                                      from "../../endpoints";
import { WalletRequestType }                                                                               from "../../request-types";
import { IWalletRequest, IPreferredWindowState, IGenericWalletOptions, IWalletRequestData, IMetaResponse } from "./../../wallet";
import { IKeyValueType }                                                                                   from "./../../wallet-service";


@WalletRequestType("Vipps")
export class VippsRequest implements IWalletRequest {
    private _preferredWindowState : IPreferredWindowState;
    private _events               : EventEmitter;
    private _pollTimeout          : number;

    constructor(
        private data: IVippsRequestData,
        options?: IGenericWalletOptions
    ) {
        if (options && options.preferredWindowState) {
            this._preferredWindowState = options.preferredWindowState;
            this._events               = options.events;
        }
    }

    public initiate(): Promise<IVippsResult> {
        const { url, method } = this.data;
        const self            = this;

        if (method === "Redirect") location.href = url;

        function poll(retries = 0): Promise<IVippsResult> {
            const maximumRetries = 15;

            self._events.emit("pollRequestInitiated", {
                retries,
                maximumRetries
            });

            function onPollRequestRejected(error) { //TODO: Move outside and call it in onParseFulfilled in if (!response.meta.result)
                if (retries >= maximumRetries)
                    throw new ConnectionError("The maximum number of retries has been exceeded.");

                return new Promise<IVippsResult>(
                    resolve => {
                        setTimeout(
                            () => resolve(poll(retries + 1)),
                            Math.pow(retries, 2) * 100
                        )
                    }
                );
            }

            return fetch(url, { headers: { "Accept": "application/json" } })

                .then<IPollResponse>(response => response.json(), onPollRequestRejected)

                .then(
                    function onPollParseFulfilled(response) {
                        self._events.emit("pollRequestFulfilled", response);

                        if (!response || !response.meta)
                            throw new NoResponseError("The response was empty.");

                        if (!response.meta.result)
                            throw new AuthorizationError(response.meta.message.merchant);

                        if (response.wait) return poll();
                        
                        if (!response.authorizeresult)
                            throw new AuthorizationError(response.meta.message.merchant);

                        return Promise.resolve({
                            redirectUrl     : response.redirecturl,
                            authorizeResult : response.authorizeresult,
                            parameters      : response.parameters
                        });
                    }
                );
        }

        return poll();
    }
}

export interface IVippsRequestData extends IWalletRequestData {
	url    : string;
	method : "Redirect" | "Poll";
}

export interface IPollResponse extends IMetaResponse {
	redirecturl     : string;
	wait            : boolean;
	authorizeresult : boolean;
	parameters      : Array<IKeyValueType<string>>;
}

export interface IVippsResult {
	redirectUrl     : string;
	authorizeResult : boolean;
	parameters      : Array<IKeyValueType<string>>;
}