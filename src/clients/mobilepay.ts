import * as endpoints        from "../endpoints";
import { WalletRequestType } from "../request-types";
import {
    IWalletRequest,
    IWalletRequestData,
    IPreferredWindowState,
    IGenericWalletOptions,
    IWalletResult,
}                            from "../wallet";

@WalletRequestType("MobilePay")
export class MobilePayRequest implements IWalletRequest {
    private _preferredWindowState : IPreferredWindowState;
    private _walletEndpoint       : string;
    private _target               : string = "_self";

    constructor(
        private data : IMobilePayRequestData,
        options?     : IGenericWalletOptions,
    ) {
        if (options) {
            if (options.preferredWindowState) {
                this._preferredWindowState = options.preferredWindowState;
            }

            if (options.walletEndpoint) {
                this._walletEndpoint = options.walletEndpoint;
            }

            if (options.target) {
                this._target = options.target;
            }
        }
    }

    public initiate(): Promise<IWalletResult> {
        //MobilePay V2
        if(this.data.Url) {
            window.location.href = this.data.Url;
        } else {
            //MobilePay V1
            if (!this.data.Version) this.data.Version = "1";
            const form = document.createElement("form");
            form.action = this._walletEndpoint || endpoints.mobilePay.productionClient;
            form.method = "POST";
            form.target = this._target;
            for (let key in this.data) {
                if (this.data.hasOwnProperty(key)) {
                    let input = document.createElement("input");

                    input.type  = "hidden";
                    input.name  = key;
                    input.value = this.data[key];

                    form.appendChild(input);
                }
            }
            document.body.appendChild(form);
            form.submit();
        }

        return new Promise<IWalletResult>((resolve, reject) => {
            // Implement mobile pay in overlay
        });
    }
}

export interface IMobilePayClassicRequestData extends IWalletRequestData {
    SessionToken : string;
    PhoneNumber? : string;
    Version?     : string;
    Url?         : string;
}

export interface IMobilePayCheckoutRequestData extends IWalletRequestData {
    CheckoutToken : string;
    PhoneNumber?  : string;
    Version?      : string;
    Url?          : string;
}

export type IMobilePayRequestData = IMobilePayClassicRequestData | IMobilePayCheckoutRequestData;
