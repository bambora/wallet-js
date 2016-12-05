interface IMobilePayRequest extends IGenericWalletRequest {
	SessionToken: string;
	PhoneNumber?: string;
}