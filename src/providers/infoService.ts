import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { LeadSourceGuid } from '../helpers/leadSourceGuid';

@Injectable() 
export class InfoService {
    client: any = [];
    leadsource: any = [];
    seat: string = null;

    currentToken: {
        SessionToken: null
    };

    constructor(private http: Http) {}

    // Get Client Info
    getClientInfo() {
        return this.http.get('http://localhost/clientinfo').map(res => res.json()).map((r) => {
            this.client = r;
            return r;
        });
    }

    // Get Lead Source Info
    getLeadSource() {
        return this.http.get(`http://localhost/leadsources/${LeadSourceGuid.guid}`).map(res => res.json()).map((r) => {
            this.leadsource = r.LeadSource;
            return r.LeadSource;
        });
    }

    // Helper - Get Application Information
    getApplicationInformation() : string {        
        return `vCapture Pro version ${this.client.ApplicationVersion}`;
    }

    // Helper - Get Device Information
    getDeviceInformation() : string {
        let c = this.client;
        return `${c.DeviceType} running ${c.SystemName} ${c.SystemVersion}`;
    }

    // Helper - Get Camera Status
    getCameraStatus(camera) : boolean {
        return this.client[camera];
    }

    // Helper - Get Linea Status
    getLineaStatus() : boolean {
        return (!this.client.Scanner || this.client.Scanner === 'None') ? false : true;
    }

    // Get Current Seat
    getSeat() {
        return this.http.get(`http://localhost/leadsources/${LeadSourceGuid.guid}/seat`).map(res => res.json()).map((r) => {
            if (r && r.SeatGuid) {
                this.seat = r.SeatGuid;
            }
            return r;
        });
    }

    // Get Current Token
    getCurrentToken() {
        return this.currentToken.SessionToken;
    }

    // Update Token
    updateToken() {
        return this.initiateChallenge()
            .flatMap(data => this.computeHash(data))
            .flatMap(data => this.validateChallenge(data))
            .flatMap(data => this.saveToken(data));
    }

    // Update Token -- step #1
    private initiateChallenge() {
        const loginArgs = {
            loginRestUrl: this.leadsource.LoginUrl,
            authCode: this.leadsource.AuthCode,
            authGuid: this.leadsource.AuthGuid
        };
        return this.http.post(`${loginArgs.loginRestUrl}/InitiateChallenge/${loginArgs.authGuid}`, loginArgs).map(res => res.json()).map((r) => {
            loginArgs['challenge'] = r;
            return loginArgs;
        });
    }
    
    // Update Token -- step #2
    private computeHash(loginArgs) {
        const request = {
            authcode: loginArgs.authCode,
            nonce: loginArgs.challenge.Nonce
        };
        return this.http.post('http://localhost/digestauthentication/computehash', request).map(res => res.json()).map((r) => {
            loginArgs['hash'] = r.Hash;
            return loginArgs;
        });
    }

    // Update Token -- step #3
    private validateChallenge(loginArgs) {
        let urlHash = loginArgs.hash.replace(/\//g, "_");
        urlHash = urlHash.replace(/\+/g, '-');
        return this.http.post(`${loginArgs.loginRestUrl}/ValidateChallenge/${loginArgs.challenge.ChallengeGuid}/${encodeURIComponent(urlHash)}`, loginArgs).map(res => res.json()).map((r) => {
            return {
                SessionToken: r.SessionToken
            };
        });
    }

    // Update Token -- step #4
    private saveToken(loginArgs) {
        this.currentToken.SessionToken = loginArgs.SessionToken;
        return this.http.put(`http://localhost/leadsources/${LeadSourceGuid.guid}/sessiontoken`, this.currentToken).map(res => res.json());
    }
}