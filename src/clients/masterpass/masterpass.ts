/// <reference path="../../wallet.d.ts" />
/// <reference path="./masterpass.d.ts" />
import {
    endpoints,
    WalletRequestType
} from "../../";


@WalletRequestType("masterpass")
export class MasterPassRequest implements IWalletRequest {
    constructor(private options: IMasterPassRequest) { }

    _script;

    public initiate(): Promise<any> {
        const promise = this.loadScriptIfNotAlreadyLoaded()
            .then(() => this.sendRequest())
            .then(function onMasterPassLightboxRequestFulfilled(mpLightboxResponse) {
                console.log(mpLightboxResponse);
                // TODO: handle masterpass response
            })
            .catch(function onMasterPassLightboxRequestRejected(mpLightboxResponse) {
                console.log(mpLightboxResponse);
                // TODO: handle masterpass error
            });

        return promise;
    }

    private sendRequest(): Promise<any> {
        const promise = new Promise<any>((resolve, reject) => {
            MasterPass.client.checkout({
                requestToken: this.options.requestToken,
                callbackUrl: this.options.callbackUrl,
                failureCallback: mpLightboxResponse => reject(mpLightboxResponse), // TODO: should be changed to instance of Error.
                cancelCallback: mpLightboxResponse => reject(mpLightboxResponse),
                successCallback: mpLightboxResponse => resolve(mpLightboxResponse),
                merchantCheckoutId: this.options.merchantCheckoutId,
                allowedCardTypes: this.options.allowedCardTypes,
                version: "v6"
            });
        })

        return promise;
    }

    private loadScriptIfNotAlreadyLoaded(): Promise<Event> {
        const promise = new Promise<Event>((resolve, reject) => {
            if(this._script) {
                resolve();
            } else {
                this._script = this._script || document.createElement("script");

                this._script.async = false;
                this._script.src = endpoints.masterPass.productionClientApi;

                this._script.onload = event => resolve(event);
                this._script.onerror = event => reject(event);

                document.head.appendChild(this._script);
            }
        })

        promise.catch(function onScriptLoadRejected(event) {
            // TODO: handle script load error
        })

        return promise;
    }
}