import * as endpoints                                                                       from "../../endpoints";
import { WalletRequestType }                                                                from "../../request-types";
import { WalletResponseTransformer }                                                        from "../../response-transformers";
import { Promise }                                                                          from "es6-promise";
import { IWalletRequest, IPreferredWindowState, IGenericWalletOptions, IWalletRequestData } from "../../wallet";
import { IWalletSessionResponse, IValidWalletSessionResponse }                              from "../../wallet-service";


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

    public initiate(): Promise<any> {
        const promise = this.loadScriptIfNotAlreadyLoaded()

            .then(() => this.sendRequest())

            .then(function onMasterPassLightboxRequestFulfilled(mpLightboxResponse) {
                return mpLightboxResponse.mpstatus;
            })

            .catch(function onMasterPassLightboxRequestRejected(mpLightboxResponse) {
                return new Error(mpLightboxResponse.mpstatus);
            });

        return promise;
    }

    private sendRequest(): Promise<any> {
        const promise = new Promise<any>((resolve, reject) => {
            MasterPass.client.checkout({
                requestToken                  : this.data.requestToken,
                callbackUrl                   : this.data.callbackUrl,
                failureCallback               : mpLightboxResponse => reject(mpLightboxResponse), // TODO : should be changed to instance of Error.
                cancelCallback                : mpLightboxResponse => reject(mpLightboxResponse),
                successCallback               : mpLightboxResponse => resolve(mpLightboxResponse),
                merchantCheckoutId            : this.data.merchantCheckoutId,
                allowedCardTypes              : this.data.allowedCardTypes,
                version                       : "v6",
                suppressShippingAddressEnable : this.data.suppressShippingAddressEnable as any === "true"
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
                this._script.src   = endpoints.masterPass.sandboxClientApi;//productionClientApi;

                this._script.onload  = event => resolve(event);
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


@WalletResponseTransformer("masterpass")
export class MasterPassResponseTransformer {
    transform(response: IWalletSessionResponse): IValidWalletSessionResponse {
        const validData = response.session.data.map(data => {
            if(data.type === "array") {
                return {
                    type: data.type,
                    key: data.key,
                    value: data.value.split(",")
                };
            }

            return data;
        })

        const validResponse: IValidWalletSessionResponse = {
            session: {
                walletname: response.session.walletname,
                data: validData
            }
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