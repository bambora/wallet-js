/// <reference path="./wallet.d.ts" />
import { Promise }      from "es6-promise";
import { EventEmitter } from "eventemitter3";
import {
    endpoints,
    walletRequestTypes,
    MasterPassRequest,
    MobilePayRequest,
    TestRequest,
    WalletService,
    getWalletRequestType
}                       from "./";

export default class Wallet implements IWallet {
    public events = new EventEmitter();

    public open(sessionId: string, options: IGenericWalletOptions = {}): Promise<any> {
        options.preferredWindowState = options.preferredWindowState || "overlay";
        options.events               = this.events;

        const walletService  = new WalletService(options);
        const sessionPromise = walletService.getSession(sessionId);

        sessionPromise.then(
            function onGetSessionFulfilled(response) {
                const walletRequestConstructable = getWalletRequestType(response.session.walletname);
                const walletOptions              = Wallet.getWalletOptions(response.session.data);
                const walletRequest              = new walletRequestConstructable(walletOptions, options);

                return walletRequest.initiate();
            }
        );

        return sessionPromise;
    }

    private static getWalletOptions(responseData: Array<IKeyValueType<any>>): IWalletRequestData {
        const walletOptions = responseData.reduce(
            (previous, current) => {
                previous[current.key] = current.value;
                return previous;
            },
            {} as IWalletRequestData
        );

        return walletOptions;
    }
}

if(window) {
    window.Bambora        = window.Bambora || {};
    window.Bambora.Wallet = window.Bambora.Wallet || Wallet;
}