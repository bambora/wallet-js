interface IWalletSessionResponse {
    session: {
        walletname: IWalletName;
        data: Array<IKeyValueType<string>>;
    }
}

interface IValidWalletSessionResponse {
    session: {
        walletname: IWalletName;
        data: Array<IKeyValueType<any>>;
    }
}

interface IKeyValueType<T> {
    key: string;
    value: T;
    type: "string" | "array";
}