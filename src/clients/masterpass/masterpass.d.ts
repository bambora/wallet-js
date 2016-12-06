interface IMasterPassRequestData extends IWalletRequestData {
	requestPairing?: boolean;
	requestToken: string;
	pairingRequestToken?: string;
	callbackUrl: string;
	failureCallback: Function;
	cancelCallback: Function;
	successCallback: Function;
	merchantCheckoutId: string;
	requestedDataTypes?: Array<"REWARD_PROGRAM" | "ADDRESS" | "PROFILE" | "CARD">;
	allowedCardTypes: Array<"master" | "amex" | "diners" | "discover" | "maestro" | "visa">;
	version?: string;
}

interface IMasterPassClient {
	addPaymentMethod(options: any): void;
	addShippingAddress(options: any): void;
	cardSecurity(options: any): void;
	checkout(request: IMasterPassRequestData): void;
	checkoutButton(options: any): void;
	connect(options: any): void;
	connectButton(options: any): void;
	manage(options: any): void;
	register(options: any): void;
	viewWallets(options: any): void;
}

interface IMasterPass {
	client: IMasterPassClient;
}

declare const MasterPass: IMasterPass;