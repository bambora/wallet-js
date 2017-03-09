interface IVippsRequestData extends IWalletRequestData {
	url    : string;
	method : "Redirect" | "Poll";
}

interface IPollResponse extends IMetaResponse {
	redirecturl     : string;
	wait            : boolean;
	authorizeresult : boolean;
	parameters: Array<IKeyValueType<string>>;
}

interface IVippsResult {
	redirectUrl     : string;
	authorizeResult : boolean;
	parameters: Array<IKeyValueType<string>>;
}