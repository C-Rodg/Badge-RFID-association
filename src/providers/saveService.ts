import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/forkJoin'
import 'rxjs/add/operator/catch';

import { InfoService } from './infoService';

import { LeadSourceGuid } from '../helpers/leadSourceGuid';

@Injectable()
export class SaveService {

    private prefix = 'http://localhost/leadsources/';
    private backgroundInterval: any = null;

    constructor(
        private http: Http,
        private infoService: InfoService
    ) { }

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
        });
    }

    // Find leads
    find(query) {
        return this.http.get(`${this.prefix}${LeadSourceGuid.guid}/leads?${query}`).map(res => res.json());
    }

    // Find visits
    findVisits(query) {
        return this.http.get(`${this.prefix}${LeadSourceGuid.guid}/visits?${query}`).map(res => res.json());
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

    // Mark Uploaded
    markUploaded(leadGuid) {
        return this.http.put(`${this.prefix}${LeadSourceGuid.guid}/leads/${leadGuid}/uploaded`, {}).map(res => res.json());
    }

    // Mark local DB as deleted
    markDeleted(leadGuid) {
        return this.http.put(`${this.prefix}${LeadSourceGuid.guid}/leads/${leadGuid}/deleted`, {}).map(res => res.json());
    }

    // Mark local DB as undeleted
    markUndeleted(leadGuid) {
        return this.http.put(`${this.prefix}${LeadSourceGuid.guid}/leads/${leadGuid}/undeleted`, {}).map(res => res.json());
    }

    // Start background uploading
    initializeBackgroundUpload(mins) {
        clearInterval(this.backgroundInterval);
        if (mins === 0) {
            return false;
        }
        let time = mins * 60 * 1000;
        this.backgroundInterval = setInterval(() => {
            this.backgroundUpload();
        }, time);
    }

    // Upload in background
    backgroundUpload() {
        if (!window.navigator.onLine) {
            return false;
        }
        return this.uploadPending();
    }    

    // Uploading any pending scans
    // TODO -- UPLOAD TO 3rd Party Service!!!
    uploadPending() {
        if (!window.navigator.onLine) {
            return Observable.throw("Please check your internet connection");
        }

        return this.find('uploaded=no&error=no')
            .flatMap((data) => {
                let leads = data,
                    requests = [],
                    i = 0,
                    len = leads.length;
                for(; i < len; i++) {
                    requests.push(this.upload(leads[i]));
                }

                if (len === 0) {
                    return Observable.of([]);
                }
                return this.infoService.updateToken().flatMap(() => {
                    return Observable.forkJoin(requests);
                });
            });
    }

    // Upload single lead
    upload(lead) {
        let seat = null;
        return this.infoService.getSeat()
        .flatMap((newSeat) => {
            seat = newSeat.SeatGuid;
            return Observable.of(seat);
        })
        .flatMap(() => this.findVisits(`ScanData=${lead.ScanData}`))
        .flatMap((visits) => {

            const markDeleted = lead.DeleteDateTime !== null;

            const req = {
                SourceApplicationId: lead.LeadGuid,
                AcquisitionUtcDateTime: lead.CreateDateTime,
                Keys: lead.Keys,
                TranslateKeys: null,
                Responses: lead.Responses,
                MarkedAsDeleted: markDeleted
            };

            const url = `${this.infoService.leadsource.LeadSourceUrl}/UpsertLead/${LeadSourceGuid.guid}/${seat}`;
            let headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('Authorization', `ValidarSession token="${this.infoService.getCurrentToken()}"`);
            return this.http.post(url, req, { headers }).map(res => res.json())
                .flatMap(() => {
                    return this.markUploaded(lead.LeadGuid);
                })
                .catch((err) => {
                    if (err && err.Fault && err.Fault.Type === 'InvalidSessionFault') {
                        return this.infoService.updateToken().flatMap(() => this.upload(lead));
                    }
                    return Observable.throw(err);
                });
        });
    }
}