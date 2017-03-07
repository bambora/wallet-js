// Generic wallet
interface IWallet {
    open(sessionId: string, options?: IGenericWalletOptions): Promise<any>;
}

declare type IWalletName = "masterpass" | "mobilepay" | "test";

declare type IPreferredWindowState = "fullscreen" | "overlay";

interface IGenericWalletOptions {
    preferredWindowState? : IPreferredWindowState; // default : "overlay"
    endpoint?             : string;			       // default : bambora default API endpoint
    defaultHeaders?       : IHeaders;              // default : undefined
}


// Request
interface IWalletRequestData { }

interface IWalletRequestConstructable {
    new(data: IWalletRequestData, options?: IGenericWalletOptions): IWalletRequest;
}

interface IWalletRequest {
    /** Initiates the wallet request */
    initiate(): Promise<any>;
}


// Response
interface IWalletResponseTransformerConstructable {
    new(): IWalletResponseTransformer;
}

interface IWalletResponseTransformer {
    transform(response: IWalletSessionResponse): IValidWalletSessionResponse;
}

interface IMetaResponse {
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


// Browser
interface Window {
    Bambora: {
        Wallet?: any;
    };
}