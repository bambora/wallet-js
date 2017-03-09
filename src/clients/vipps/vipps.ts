/// <reference path="./vipps.d.ts" />
import { Promise }                                              from "es6-promise";
import * as fetch                                               from "isomorphic-fetch";
import { EventEmitter }                                         from "eventemitter3";
import { AuthorizationError, ConnectionError, NoResponseError } from "../../errors";
import * as endpoints                                           from "../../endpoints";
import { WalletRequestType }                                    from "../../request-types";


@WalletRequestType("vipps")
export class VippsRequest implements IWalletRequest {
    private _preferredWindowState : IPreferredWindowState;
    private _events               : EventEmitter;

    constructor(
        private data: IVippsRequestData,
        options?: IGenericWalletOptions
    ) {
        if (options && options.preferredWindowState) {
            this._preferredWindowState = options.preferredWindowState;
            this._events = options.events;
        }
    }

    public initiate(): Promise<IVippsResult> {
        const { url, method } = this.data;
        const self = this;

        if (method === "Redirect") location.href = url;

        function poll(retries = 0): Promise<IVippsResult> {
            const maximumRetries = 15;

            self._events.emit("pollRequestInitiated", {
                retries,
                maximumRetries
            });

            return fetch(url)
                .then<IPollResponse>(
                    response => response.json(),
                    function onPollRequestRejected(error) {
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
                )
                .then(
                    function onPollParseFulfilled(response) {
                        self._events.emit("pollRequestFulfilled", response);

                        if (!response || !response.meta)
                            throw new NoResponseError("The response was empty.");

                        if (!response.meta.result)
                            throw new AuthorizationError(response.meta.message.merchant);

                        if (response.wait) return poll();

                        return {
                            redirectUrl     : response.redirecturl,
                            authorizeResult : response.authorizeresult,
                            parameters      : response.parameters
                        };
                    }
                );
        }

        return poll();
    }
}