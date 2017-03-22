import { Promise }                                                                                                                       from "es6-promise";
import * as fetch                                                                                                                        from "isomorphic-fetch";
import { EventEmitter }                                                                                                                  from "eventemitter3";
import { AuthorizationError, ConnectionError, NoResponseError }                                                                          from "../errors";
import { WalletRequestType }                                                                                                             from "../request-types";
import { IWalletRequest, IPreferredWindowState, IGenericWalletOptions, IWalletRequestData, IMetaResponse, IKeyValueType, IWalletResult } from  "../wallet";


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

    public initiate(): Promise<IWalletResult> {
        const { url, method } = this.data;
        var events            = this._events;

        if (method === "Redirect") location.href = url;

        function poll(retries = 0): Promise<IWalletResult> {
            const maximumRetries = 15;

            events.emit("pollRequestInitiated", {
                retries,
                maximumRetries
            });

            function onPollRequestRejected(error?): Promise<IWalletResult> { //TODO: Move outside and call it in onParseFulfilled in if (!response.meta.result)
                if (retries >= maximumRetries)
                    throw new ConnectionError("The maximum number of retries has been exceeded.");

                return new Promise<IWalletResult>(
                    resolve => {
                        setTimeout(
                            () => resolve(poll(retries + 1)),
                            Math.pow(retries, 2) * 100
                        )
                    }
                );
            }

            return fetch(url, { headers: { "Accept": "application/json" } })
                .then<IPollResponse>(
                    response => response.json(),
                    onPollRequestRejected
                )
                .then(
                    function onPollParseFulfilled(response): Promise<IWalletResult> {
                        events.emit("pollRequestFulfilled", response);

                        if (!response || !response.meta)
                            throw new NoResponseError("The response was empty.");

                        if (!response.meta.result)
                            return onPollRequestRejected();

                        if (response.wait) return poll();
                        
                        if (!response.authorizeresult)
                            throw new AuthorizationError(response.meta.message.merchant);

                        return Promise.resolve<IWalletResult>({
                            walletName: "Vipps",
                            data: {
                                redirectUrl     : response.redirecturl,
                                authorizeResult : response.authorizeresult,
                                parameters      : response.parameters
                            }
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