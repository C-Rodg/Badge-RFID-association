import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { LeadSourceGuid } from '../helpers/leadSourceGuid';

@Injectable() 
export class InfoService {
    client: any = [];
    leadsource: any = [];

    constructor(private http: Http) {}

    getClientInfo() {
        return this.http.get('http://localhost/clientinfo').map(res => res.json()).map((r) => {
            this.client = r;
            return r;
        });
    }

    getLeadSource() {
        return this.http.get(`http://localhost/leadsources/${LeadSourceGuid.guid}`).map(res => res.json()).map((r) => {
            this.leadsource = r.LeadSource;
            alert(JSON.stringify(r.LeadSource));
            return r.LeadSource;
        });
    }
}