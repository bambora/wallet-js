interface IVippsRequestData extends IWalletRequestData {
	url    : string;
	method : "Redirect" | "Poll";
}

interface IPollResponse extends IMetaResponse {
	redirecturl     : string;
	wait            : boolean;
	authorizeresult : boolean;
	parameters: Array<{
		key   : string;
		value : string;
	}>;
}

interface IVippsResult {
	redirectUrl     : string;
	authorizeResult : boolean;
	parameters: Array<{
		key   : string;
		value : string;
	}>;
}