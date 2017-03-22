import { Promise }                                                            from "es6-promise";
import { EventEmitter }                                                       from "eventemitter3";
import getWalletRequestType                                                   from "./request-types";
import WalletService, { IWalletSessionResponse, IValidWalletSessionResponse } from "./wallet-service";

export default class Wallet {
    public events = new EventEmitter();

    public open(sessionId: string, options: IGenericWalletOptions = {}): Promise<any> {
        options.preferredWindowState = options.preferredWindowState || "overlay";
        options.events               = this.events;

        const walletService  = new WalletService(options);
        const sessionPromise = walletService.getSession(sessionId)
            .then(
                function onGetSessionFulfilled(response) {
                    const walletRequestConstructable = getWalletRequestType(response.session.walletname);
                    const walletOptions              = Wallet.getWalletOptions(response.session.data);
                    const walletRequest              = new walletRequestConstructable(walletOptions, options);
                    
                    return walletRequest.initiate();
                }
            );

        return sessionPromise;
    }

    private static getWalletOptions(responseData: Array<IKeyValueType<any>>): IWalletRequestData {
        const walletOptions = responseData.reduce(
            (previous, current) => {
                previous[current.key] = current.value;
                return previous;
            },
            {} as IWalletRequestData
        );

        return walletOptions;
    }
}

// Generic wallet
export type IWalletName = "MasterPass" | "MobilePay" | "Test" | "Vipps";

export type IPreferredWindowState = "fullscreen" | "overlay";

export interface IGenericWalletOptions {
    preferredWindowState? : IPreferredWindowState; // default : "overlay"
    endpoint?             : string;			       // default : bambora default API endpoint
    defaultHeaders?       : IHeaders;              // default : undefined
    events?               : EventEmitter;          // default : undefined
    pollTimeout?          : number;                // default : 120 (seconds)
}

export interface IKeyValueType<T> {
    key   : string;
    value : T;
    type  : "string" | "array";
}

// Request
export interface IWalletRequestData { }

export interface IWalletRequest {
    /** Initiates the wallet request */
    initiate(): Promise<any>;
}

export interface IMetaResponse {
    meta: {
        result: boolean;
        message: {
            enduser  : string;
            merchant : string;
        };
        action: {
            source : string;
            code   : string;
            type   : string;
        };
        paging: {
            lastevaluatedkey : string;
            itemsreturned    : number;
        };
    };
}