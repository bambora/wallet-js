import { Promise } from "es6-promise";
import * as fetch from "isomorphic-fetch";
import {
    walletRequestTypes,
    MasterPassRequest,
    MobilePayRequest
} from "./";


export default class Wallet implements IWallet {
    public open(sessionToken: string, options?: IGenericWalletOptions): Promise<any> { // TODO: should use generic options to make request
        const walletType = "masterpass"; // TODO: should get from backend. 
        const walletRequestType: IWalletRequestConstructable = walletRequestTypes[walletType];
        const walletOptions: IGenericWalletRequest = {}; // TODO: get from backend and generate wallet type specific request.
        const walletRequest: IWalletRequest = new walletRequestType(walletOptions);

        return walletRequest.initiate();
    }
}

if(window) {
    window.Bambora = window.Bambora || {};
    window.Bambora.Wallet = window.Bambora.Wallet || Wallet;
}




// Fetch is to be used to call Zero
// fetch("https://merchant-v1.api.epay.eu/help").then(response => response.text()).then(ost => console.log(ost));



// Wallet callback handling could be done as follows:
//
// const wallet = new Bambora.Wallet();
//
// wallet.open("a1b2c3d4e5f6", options)
//    .then(function onFulfilled(response) => {
//          // success handler
//       })
//    .catch(function onRejected(error) => {
//          // failure/cancel handler
//       });