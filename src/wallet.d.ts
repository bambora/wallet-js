// Generic wallet
interface IWallet {
    open(sessionId: string, options?: IGenericWalletOptions): Promise<any>;
}

declare type IWalletName = "masterpass" | "mobilepay" | "test";

declare type IPreferredWindowState = "fullscreen" | "overlay";

interface IGenericWalletOptions {
    preferredWindowState?: IPreferredWindowState;		// default: "overlay"
    endpoint?: string;			                            // default: bambora default API endpoint
    defaultHeaders?: IHeaders;                              // default: undefined
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


// Browser
interface Window {
    Bambora: {
        Wallet?: any;
    };
}