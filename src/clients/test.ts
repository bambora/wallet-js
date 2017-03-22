import { Promise }                                                                                         from "es6-promise";
import * as queryString                                                                                    from "query-string";
import * as endpoints                                                                                      from "../endpoints";
import { WalletRequestType }                                                                               from "../request-types";
import { IWalletRequestData, IWalletRequest, IPreferredWindowState, IGenericWalletOptions, IWalletResult } from "../wallet";


@WalletRequestType("Test")
export class TestRequest implements IWalletRequest {
    private _preferredWindowState : IPreferredWindowState;
    private _backdrop             : HTMLDivElement;
    
    constructor(
        private data: ITestRequestData,
        options?: IGenericWalletOptions
    ) {
        if (options && options.preferredWindowState) {
            this._preferredWindowState = options.preferredWindowState;
        }
    }

    public initiate(): Promise<IWalletResult> {
        if(this._preferredWindowState === "overlay")  {
            const iframe = document.createElement("iframe");
            const url    = `${endpoints.epayZero.testClient}/?${queryString.stringify(this.data)}`; 

            iframe.setAttribute("src", url);

            iframe.style.width    = "100%";
            iframe.style.height   = "100%";
            iframe.style.border   = "0 none";
            iframe.style.bottom   = "0";
            iframe.style.top      = "0";
            iframe.style.left     = "0";
            iframe.style.right    = "0";
            iframe.style.position = "fixed";
            iframe.style.zIndex   = "10000";

            document.body.appendChild(iframe);

            this.showBackdrop();

            return new Promise<IWalletResult>((resolve, reject) => {
                window.addEventListener("message", onMessageReceived);

                function onMessageReceived(event) {
                    if(event.origin !== "https://wallet-v1.api-epay.eu") return; // TODO: put into endpoints & set via option
                    
                    const message = event.data;

                    const result: IWalletResult = {
                        walletName: "Test",
                        data: event.data
                    }
                    
                    if(result.data && result.data.status) {
                        switch(result.data.status) {
                            case "success": {
                                resolve(result);
                                break;
                            }
                            case "error": {
                                reject(result);
                                break;
                            }
                            case "cancel": {
                                reject(result);
                                break;
                            }
                        }
                    }

                    window.removeEventListener("message", onMessageReceived);
                }
            });
        }

        const form = document.createElement("form");

        form.action = endpoints.epayZero.testClient;
        form.method = "GET";
        form.target = "_self";

        for(let key in this.data) {
            let input = document.createElement("input");

            input.type  = "hidden";
            input.name  = key;
            input.value = this.data[key];

            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();

        // The returned object does not matter for fullscreen context,
        // as the user is redirected before we get to this point.
        // We can simply return an empty promise to meet the interface.
        return new Promise((resolve, reject) => { });
    }

    private showBackdrop() {
        if(!this._backdrop) {
            this._backdrop = document.createElement("div");
            
            this._backdrop.style.position   = "fixed";
            this._backdrop.style.zIndex     = "9999";
            this._backdrop.style.background = "rgba(0, 0, 0, 0.48)";
            this._backdrop.style.width      = "100%";
            this._backdrop.style.height     = "100%";
            this._backdrop.style.top        = "0";
            this._backdrop.style.left       = "0";
            this._backdrop.style.right      = "0";
            this._backdrop.style.bottom     = "0";
            this._backdrop.style.display    = "none";
            this._backdrop.style.opacity    = "0";
            this._backdrop.style.transition = "all 500ms ease-in-out";

            document.body.appendChild(this._backdrop);
        }

        this._backdrop.style.display = "block";

        setTimeout(() => {
            this._backdrop.style.opacity = "1";
        }, 1)
    }

    private hideBackdrop() {
        if(!this._backdrop) return;

        this._backdrop.style.opacity = "0";

        setTimeout(() => {
            this._backdrop.style.display = "none";
        }, 500)
    }
}

export interface ITestRequestData extends IWalletRequestData {
	returnUrl: string;
}