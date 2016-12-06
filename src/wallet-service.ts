/// <reference path="./wallet-service.d.ts" />
import * as fetch from "isomorphic-fetch";
import {
    endpoints,
    getWalletResponseTransformer
} from "./";


export class WalletService {
    private _endpoint = endpoints.epayZero.walletApi;
    private _defaultHeaders: IHeaders = new Headers({
        "Accept": "application/json, text/plain, */*"
    });

    constructor(options?: IGenericWalletOptions) {
        if (options) {
            if(options.endpoint) this._endpoint = options.endpoint;
            if(options.defaultHeaders) this._defaultHeaders = options.defaultHeaders;
        }
    }

    public getSession(sessionId: string): Promise<IValidWalletSessionResponse> {
        const promise = fetch(`${this._endpoint}/sessions/${sessionId}`, {
            headers: this._defaultHeaders
        })

        .then<IWalletSessionResponse>(response => response.json())
        
        .catch<IWalletSessionResponse>(function onGetSessionRejected(error) {
            // TODO: handle fetch errors
            return error;
        })

        .then<IValidWalletSessionResponse>(jsonResponse => {
            const transformer = getWalletResponseTransformer(jsonResponse.session.walletname);

            if(transformer) {
                return transformer.transform(jsonResponse);
            }

            return jsonResponse;
        });

        return promise;

        // Mobilepay test response
        // return new Promise((resolve, reject) => {
        //     resolve({
        //         session: {
        //             walletname: "mobilepay",
        //             data: [
        //                 {key: "SessionToken", value: "2016-12-05-14.08.32.815312"},
        //                 {key: "PhoneNumber", value: "40428643"}
        //             ]
        //         }
        //     });
        // })
        
        // // Masterpass test response
        // return new Promise((resolve, reject) => {
        //     resolve({
        //         session: {
        //             walletname: "masterpass",
        //             data: [
        //                 {key: "requestToken", value: "1c140e5de368763067bcf95283a82f1d60002362"},
        //                 {key: "callbackUrl", value: "http://test.masterpass.epay.eu:3000"},
        //                 {key: "merchantCheckoutId", value: "32fa873be44a43d8bf7c4c1ba7a9c97b"},
        //                 {key: "allowedCardTypes", value: "master,amex,diners,discover,maestro,visa"}
        //             ]
        //         }
        //     });
        // })
    }
}