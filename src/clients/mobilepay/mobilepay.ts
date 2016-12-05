/// <reference path="../../wallet.d.ts" />
/// <reference path="./mobilepay.d.ts" />
import {
    endpoints,
    WalletRequestType
} from "../../";


@WalletRequestType("mobilepay")
export class MobilePayRequest implements IWalletRequest {
    constructor(private options: IMobilePayRequest) { }

    public initiate(): Promise<any> {
        // const promise = this.loadScriptIfNotAlreadyLoaded()
        //     .then(() => this.sendRequest())
        //     .then(function onMasterPassLightboxRequestFulfilled(mpLightboxResponse) {
        //         console.log(mpLightboxResponse);
        //         // TODO: handle masterpass response
        //     })
        //     .catch(function onMasterPassLightboxRequestRejected(mpLightboxResponse) {
        //         console.log(mpLightboxResponse);
        //         // TODO: handle masterpass error
        //     });

        // return promise;

        return new Promise((resolve, reject) => {});
    }
}