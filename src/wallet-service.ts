import * as fetch                                            from "isomorphic-fetch";
import { Promise }                                           from "es6-promise";
import * as endpoints                                        from "./endpoints";
import getWalletResponseTransformer                          from "./response-transformers";
import { IGenericWalletOptions, IWalletName, IKeyValueType } from  "./wallet";

export default class WalletService implements IWalletService {
    private _endpoint = endpoints.epayZero.walletApi;

    private _defaultHeaders = {
        Accept: "application/json, text/plain, */*",
    };

    constructor(options?: IGenericWalletOptions) {
        if (options) {
            if (options.endpoint)
                this._endpoint = options.endpoint;

            if (options.defaultHeaders)
                this._defaultHeaders = options.defaultHeaders;
        }
    }

    public getSession(sessionId: string): Promise<IValidWalletSessionResponse> {
        const promise = fetch(`${this._endpoint}/sessions/${sessionId}`, {
            headers: this._defaultHeaders,
        })

        .then<IWalletSessionResponse>(response => response.json())

        .then<IValidWalletSessionResponse>(jsonResponse => {
            const transformer = getWalletResponseTransformer(jsonResponse.session.walletname);

            if (transformer)
                return transformer.transform(jsonResponse);

            return jsonResponse;
        });

        return promise;
    }
}

export interface IWalletService {
    getSession: (sessionId: string) => Promise<IValidWalletSessionResponse>;
}

export interface IWalletSessionResponse {
    session: {
        walletname : IWalletName;
        data       : Array<IKeyValueType<string>>;
    };
}

export interface IValidWalletSessionResponse {
    session: {
        walletname : IWalletName;
        data       : Array<IKeyValueType<any>>;
    };
}
