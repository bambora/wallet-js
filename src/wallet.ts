import { Promise } from "es6-promise";
import {
    endpoints,
    walletRequestTypes,
    MasterPassRequest,
    MobilePayRequest,
    WalletService,
    getWalletRequestType
} from "./";


export default class Wallet implements IWallet {
    public open(sessionId: string, options?: IGenericWalletOptions): Promise<any> {
        const walletService = new WalletService(options);
        const sessionPromise = walletService.getSession(sessionId);

        sessionPromise.then(response => {
            const walletRequestConstructable = getWalletRequestType(response.session.walletname);
            const walletOptions = Wallet.getWalletOptions(response.session.data);
            const walletRequest = new walletRequestConstructable(walletOptions, options);

            return walletRequest.initiate();
        })

        sessionPromise.catch(function onGetSessionRejected(error) {
            // handle error
            return error;
        });

        return sessionPromise;
    }

    private static getWalletOptions(responseData: Array<IKeyValueType<any>>): IWalletRequestData {
        const walletOptions = responseData.reduce((previous, current) => {
            previous[current.key] = current.value;
            return previous;
        }, {} as IWalletRequestData);

        return walletOptions;
    }
}

if(window) {
    window.Bambora = window.Bambora || {};
    window.Bambora.Wallet = window.Bambora.Wallet || Wallet;
}