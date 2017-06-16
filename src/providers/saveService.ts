import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';

import { LeadSourceGuid } from '../helpers/leadSourceGuid';

@Injectable()
export class SaveService {

    private prefix = 'http://localhost/leadsources/';

    constructor(private http: Http) { }

    // Start Saving a pair of scans
    startSave(scanObj) {
        return this.find(`ScanData=${scanObj.badge}`).flatMap((data) => {
            // Already existing scan
            if (data && data.length > 0) {
                const visit = {
                    ScanData: scanObj.badge,
                    CapturedBy: scanObj.user,
                    CaptureStation: scanObj.station
                };
                const lead = {
                    Responses: data[0].Responses,
                    Keys: data[0].Keys
                };
                if ( lead.Keys.filter((k) => k.Type === 'F9F457FE-7E6B-406E-9946-5A23C50B4DF5').length > 0) {
                    lead.Keys.forEach((obj) => {
                        if (obj.Type === 'F9F457FE-7E6B-406E-9946-5A23C50B4DF5') {
                            obj.Value = `${scanObj.device}|${scanObj.station}`;
                        }
                    });
                } else {
                    const o = {
                        Type: "F9F457FE-7E6B-406E-9946-5A23C50B4DF5",
                        Value: `${scanObj.device}|${scanObj.station}`
                    };
                    lead.Keys.push(o);
                } 
                if (lead.Responses.filter(r => r.Tag === 'lcRFID').length > 0) {
                    let i = 0, j = lead.Responses.length;
                    for(; i < j; i++) {
                        if (lead.Responses[i].Tag === 'lcRFID') {
                            lead.Responses[i].Value = scanObj.rfid;
                        }
                    }
                } else {
                    lead.Responses.push({ Tag: 'lcRFID', Value: scanObj.rfid });
                }
                return this.saveVisit(visit).flatMap(() => {
                    return this.saveReturning(lead, data[0].LeadGuid);
                });
            } 
            // Completely new lead
            else {
                const lead = {
                    ScanData: scanObj.badge,
                    Keys: [{"Type":"7A56282B-4855-4585-B10B-E76B111EA1DB", "Value": scanObj.badge }],
                    Responses: []
                };
                let resp = lead.Responses;
                resp.push({"Tag": "lcBadgeId", "Value": scanObj.badge });
                resp.push({"Tag":  "lcRFID", "Value": scanObj.rfid });

                return this.saveNew(lead).flatMap((person) => {
                    lead["LeadGuid"] = person.LeadGuid;
                    const visit = {
                        ScanData: scanObj.badge,
                        CapturedBy: scanObj.user,
                        CaptureStation: scanObj.station
                    };
                    return this.saveVisit(visit);
                });
            }
        })
    } // 

    // Find leads
    find(query) {
        return this.http.get(`${this.prefix}${LeadSourceGuid.guid}/leads?${query}`).map(res => res.json());
    }

    // Save new lead
    saveNew(lead) {
        return this.http.put(`${this.prefix}${LeadSourceGuid.guid}/leads`, lead).map(res => res.json());
    }

    // Save returning lead
    saveReturning(lead, leadGuid) {
        return this.http.put(`${this.prefix}${LeadSourceGuid.guid}/leads/${leadGuid}`, lead).map(res => res.json());
    }

    // Save a visit
    saveVisit(lead) {
        return this.http.put(`${this.prefix}${LeadSourceGuid.guid}/visits`, lead).map(res => res.json());
    }

    // Get Count
    count(query) {
        return this.http.get(`${this.prefix}${LeadSourceGuid.guid}/leads/count${query}`).map(res => res.json());
    }
}