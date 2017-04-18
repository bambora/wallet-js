import "isomorphic-fetch";
import { Promise }           from "es6-promise";
import { EventEmitter }      from "eventemitter3";
import { WalletRequestType } from "../request-types";
import {
    AuthorizationError,
    ConnectionError,
    NoResponseError,
}                            from "../errors";
import {
    IWalletRequest,
    IPreferredWindowState,
    IGenericWalletOptions,
    IWalletRequestData,
    IMetaResponse,
    IKeyValueType,
    IWalletResult,
}                            from "../wallet";

@WalletRequestType("Vipps")
export class VippsRequest implements IWalletRequest {
    private _preferredWindowState : IPreferredWindowState;
    private _events               : EventEmitter;
    private _pollTimeout          : number;
    private _fetch                : typeof fetch;

    constructor(
        private data : IVippsRequestData,
        options?     : IGenericWalletOptions,
        fetchFn?     : typeof fetch,
    ) {
        this._fetch = fetchFn || fetch.bind(window);

        if (options) {
            if (options.preferredWindowState)
                this._preferredWindowState = options.preferredWindowState;

            if (options.events)
                this._events = options.events;
        }
    }

    public initiate(): Promise<IWalletResult> {
        const { url, method } = this.data;
        var events            = this._events;
        var fetch             = this._fetch;

        if (method === "Redirect") location.href = url;

        function poll(retries = 0): Promise<IWalletResult> {
            const maximumRetries = 15;

            if (events) events.emit("pollRequestInitiated", { retries, maximumRetries });

            function onPollRequestRejected(error?): Promise<IWalletResult> {
                if (retries >= maximumRetries)
                    Promise.reject(new ConnectionError("The maximum number of retries has been exceeded."));

                return new Promise<IWalletResult>(
                    resolve => {
                        setTimeout(
                            () => resolve(poll(retries + 1)),
                            Math.pow(retries, 2) * 100,
                        );
                    },
                );
            }

            return fetch(url, { headers: { Accept: "application/json" } })
                .then<IPollResponse>(
                    response => response.json(),
                    reason => Promise.reject(reason),
                )
                .then(
                    function onPollParseFulfilled(response: IPollResponse): Promise<IWalletResult> {
                        if (events) events.emit("pollRequestFulfilled", response);

                        if (!response || !response.meta)
                            Promise.reject(new NoResponseError("The response was empty."));

                        if (!response.meta.result)
                            return onPollRequestRejected();

                        if (response.wait) return poll();

                        if (!response.authorizeresult)
                            Promise.reject(new AuthorizationError(response.meta.message.merchant));

                        return Promise.resolve<IWalletResult>({
                            data: {
                                authorizeResult : response.authorizeresult,
                                parameters      : response.parameters,
                                redirectUrl     : response.redirecturl,
                            },
                            walletName: "Vipps",
                        });
                    },
                    onPollRequestRejected,
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
