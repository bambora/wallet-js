import { Promise }                   from "es6-promise";
import * as endpoints                from "../endpoints";
import { WalletRequestType }         from "../request-types";
import { WalletResponseTransformer } from "../response-transformers";
import {
    IWalletRequest,
    IPreferredWindowState,
    IGenericWalletOptions,
    IWalletRequestData,
    IWalletResult,
}                                    from "../wallet";
import {
    IWalletSessionResponse,
    IValidWalletSessionResponse,
}                                    from "../wallet-service";

@WalletRequestType("MasterPass")
export class MasterPassRequest implements IWalletRequest {
    private _script               : HTMLScriptElement;
    private _preferredWindowState : IPreferredWindowState;

    constructor(
        private data : IMasterPassRequestData,
        options?     : IGenericWalletOptions
    ) {
        if (options && options.preferredWindowState) {
            this._preferredWindowState = options.preferredWindowState;
        }
    }

    public initiate(): Promise<IWalletResult> {
        const promise = this.loadScriptIfNotAlreadyLoaded()
            .then(() => this.sendRequest());

        return promise;
    }

    private sendRequest(): Promise<IWalletResult> {
        const promise = new Promise<IWalletResult>((resolve, reject) => {
            MasterPass.client.checkout({
                allowedCardTypes              : this.data.allowedCardTypes,
                callbackUrl                   : this.data.callbackUrl,
                cancelCallback                : mpLightboxResponse => reject(mpLightboxResponse),
                failureCallback               : mpLightboxResponse => reject(mpLightboxResponse),
                merchantCheckoutId            : this.data.merchantCheckoutId,
                requestToken                  : this.data.requestToken,
                successCallback               : mpLightboxResponse => resolve({
                                                    data: mpLightboxResponse,
                                                    walletName: "MasterPass",
                                                }),
                suppressShippingAddressEnable : this.data.suppressShippingAddressEnable as any === "true",
                version                       : "v6",
            });
        });

        return promise;
    }

    private loadScriptIfNotAlreadyLoaded(): Promise<Event> {
        const promise = new Promise<Event>((resolve, reject) => {
            if (this._script) {
                resolve();
            } else {
                this._script = this._script || document.createElement("script");

                this._script.async = false;
                this._script.src   = endpoints.masterPass.productionClientApi;

                this._script.onload  = event => resolve(event);
                this._script.onerror = event => reject(event);

                document.head.appendChild(this._script);
            }
        });

        return promise;
    }
}

@WalletResponseTransformer("masterpass")
export class MasterPassResponseTransformer {
    public transform(response: IWalletSessionResponse): IValidWalletSessionResponse {
        const validData = response.session.data.map(data => {
            if (data.type === "array") {
                return {
                    key: data.key,
                    type: data.type,
                    value: data.value.split(","),
                };
            }

            return data;
        });

        const validResponse: IValidWalletSessionResponse = {
            session: {
                data: validData,
                walletname: response.session.walletname,
            },
        };

        return validResponse;
    }
}

export interface IMasterPassRequestData extends IWalletRequestData {
    requestPairing?               : boolean;
    requestToken                  : string;
    pairingRequestToken?          : string;
    callbackUrl                   : string;
    failureCallback               : Function;
    cancelCallback                : Function;
    successCallback               : Function;
    merchantCheckoutId            : string;
    requestedDataTypes?           : Array<"REWARD_PROGRAM" | "ADDRESS" | "PROFILE" | "CARD">;
    allowedCardTypes              : Array<"master" | "amex" | "diners" | "discover" | "maestro" | "visa">;
    version?                      : string;
    suppressShippingAddressEnable : boolean;
}

export interface IMasterPassClient {
    addPaymentMethod(options: any)            : void;
    addShippingAddress(options: any)          : void;
    cardSecurity(options: any)                : void;
    checkout(request: IMasterPassRequestData) : void;
    checkoutButton(options: any)              : void;
    connect(options: any)                     : void;
    connectButton(options: any)               : void;
    manage(options: any)                      : void;
    register(options: any)                    : void;
    viewWallets(options: any)                 : void;
}

export interface IMasterPass {
    client: IMasterPassClient;
}

declare const MasterPass: IMasterPass;
