interface IGenericWalletOptions {
    windowState: "fullscreen" | "overlay";		// default: "overlay"
    endpoint: string;			                // default: bambora default API endpoint
}

interface IGenericWalletRequest { }

interface IWalletRequestConstructable {
    new(options: IGenericWalletRequest): IWalletRequest;
}

interface IWalletRequest {
    /** Initiates the wallet request */
    initiate(): Promise<any>;
}

interface IWallet {
    open(sessionToken: string, options?: IGenericWalletOptions): Promise<any>;
}

interface Window {
    Bambora: {
        Wallet?: any;
    };
}