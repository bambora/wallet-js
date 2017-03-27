import { Promise }          from "es6-promise";
import { EventEmitter }     from "eventemitter3";
import getWalletRequestType from "./request-types";
import WalletService, {
    IWalletService,
    IWalletServiceConstructable,
}                           from "./wallet-service";

export default class Wallet {
    private static getWalletOptions(responseData: Array<IKeyValueType<any>>): IWalletRequestData {
        const walletOptions = responseData.reduce(
            (previous, current) => {
                previous[current.key] = current.value;
                return previous;
            },
            {} as IWalletRequestData,
        );

        return walletOptions;
    }

    public events = new EventEmitter();

    private _walletService        : IWalletServiceConstructable = null;
    private _getWalletRequestType : typeof getWalletRequestType = null;

    constructor(
        walletServiceConstructable? : IWalletServiceConstructable,
        getWalletRequestTypeFn?     : typeof getWalletRequestType,
    ) {
        this._walletService        = walletServiceConstructable || WalletService;
        this._getWalletRequestType = getWalletRequestTypeFn || getWalletRequestType;
    }

    public open(sessionId: string, options: IGenericWalletOptions = {}): Promise<IWalletResult> {
        options.preferredWindowState = options.preferredWindowState || "overlay";
        options.events               = this.events;

        const walletService        = new this._walletService(options);
        const getWalletRequestType = this._getWalletRequestType;

        const sessionPromise = walletService.getSession(sessionId)
            .then(
                function onGetSessionFulfilled(response) {
                    const walletRequestConstructable = getWalletRequestType(response.session.walletname);
                    const walletOptions              = Wallet.getWalletOptions(response.session.data);
                    const walletRequest              = new walletRequestConstructable(walletOptions, options);

                    return walletRequest.initiate();
                },
            );

        return sessionPromise;
    }
}

// Generic wallet
export type IWalletName = "MasterPass" | "MobilePay" | "Test" | "Vipps";

export type IPreferredWindowState = "fullscreen" | "overlay";

export interface IGenericWalletOptions {
    preferredWindowState? : IPreferredWindowState; // default : "overlay"
    endpoint?             : string;			       // default : bambora default API endpoint
    defaultHeaders?       : any;                   // default : undefined
    events?               : EventEmitter;          // default : undefined
    pollTimeout?          : number;                // default : 120 (seconds)
}

export interface IKeyValueType<T> {
    key   : string;
    value : T;
    type? : "string" | "array";
}

// Request
export interface IWalletRequestData { }

export interface IWalletRequest {
    /** Initiates the wallet request */
    initiate(): Promise<IWalletResult>;
}

export interface IWalletResult {
    walletName : IWalletName;
    data       : any;
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
