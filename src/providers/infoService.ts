import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { LeadSourceGuid } from '../helpers/leadSourceGuid';

@Injectable() 
export class InfoService {
    client: any = [];
    leadsource: any = [];

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
}