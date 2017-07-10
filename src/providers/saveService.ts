import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/forkJoin'
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import * as moment from 'moment';

import { InfoService } from './infoService';

import { LeadSourceGuid } from '../helpers/leadSourceGuid';
import { apiCreds } from '../config/apiCreds';

@Injectable()
export class SaveService {

    private prefix = 'http://localhost/leadsources/';
    private backgroundInterval: any = null;
    private turnoutURL = 'https://apis.turnoutnow.com/attendee-mapping/post';

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
                if (lead.Responses.filter(r => r.Tag === 'lcLastScanBy').length > 0) {
                    let i = 0, j = lead.Responses.length;
                    for(; i < j; i++) {
                        if (lead.Responses[i].Tag === 'lcLastScanBy') {
                            lead.Responses[i].Value = scanObj.user;
                        }
                    }
                } else {
                    lead.Responses.push({ Tag: 'lcLastScanBy', Value: scanObj.user});
                }
                if (lead.Responses.filter(r => r.Tag === 'lcUnmapped').length > 0) {
                    let i = 0, j = lead.Responses.length;
                    for(; i < j; i++) {
                        if (lead.Responses[i].Tag === 'lcUnmapped') {
                            lead.Responses[i].Value = scanObj.fullBadge;
                        }
                    }
                } else {
                    lead.Responses.push({ Tag: 'lcUnmapped', Value: scanObj.fullBadge });
                }
                if (lead.Responses.filter(r => r.Tag === 'lcConvertedBadge').length > 0) {
                    let i = 0, j = lead.Responses.length;
                    for(; i < j; i++) {
                        if (lead.Responses[i].Tag === 'lcConvertedBadge') {
                            lead.Responses[i].Value = this.convertValidarBadgeToUpload(scanObj.fullBadge, scanObj.badge);
                        }
                    }
                } else {
                    lead.Responses.push({ Tag: 'lcConvertedBadge', Value: this.convertValidarBadgeToUpload(scanObj.fullBadge, scanObj.badge )});
                }
                return this.saveVisit(visit).flatMap(() => {
                    return this.saveReturning(lead, data[0].LeadGuid);
                });
            } 
            // Completely new lead
            else {
                const lead = {
                    ScanData: scanObj.badge,
                    Keys: [{
                        "Type":"7A56282B-4855-4585-B10B-E76B111EA1DB", 
                        "Value": scanObj.badge 
                    }, {
                        "Type": "F9F457FE-7E6B-406E-9946-5A23C50B4DF5",
                        "Value": `${scanObj.device}|${scanObj.station}`
                    }],
                    Responses: []
                };
                let resp = lead.Responses;
                resp.push({"Tag": "lcBadgeId", "Value": scanObj.badge });
                resp.push({"Tag": "lcRFID", "Value": scanObj.rfid });
                resp.push({"Tag": "lcLastScanBy", "Value": scanObj.user});
                resp.push({"Tag": "lcUnmapped", "Value": scanObj.fullBadge });
                resp.push({"Tag": "lcConvertedBadge", "Value": this.convertValidarBadgeToUpload(scanObj.fullBadge, scanObj.badge ) });

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

    // Convert Validar Badge Format to Upload Format
    // TODO: HANDLE DIFFERENTLY IF PDF417 badges
    convertValidarBadgeToUpload(scanData, id) {
        let scanStr = null, scanArr = [];
        let first = '', last = '', company = '';
        if (scanData != null && scanData.substring(0,4) === 'VQC:') {
            scanStr = scanData.substring(4);
            scanArr = scanStr.split(';');
            if (scanArr != null) {
                for (let i = 0, j = scanArr.length; i < j; i++) {
                    let field = scanArr[i].split(':');
                    if (field != null && field.length > 0) {
                        if (field[0] === 'ID') {

                        } else if (field[0] === 'FN') {
                            first = field[1];
                        } else if (field[0] === 'LN') {
                            last = field[1];
                        } else if (field[0] === 'CO') {
                            company = field[1];
                        }
                    }
                }
            }
            return [id, first, last, company].join('^');            
        } else if (scanData === id) {
            return [id, first, last, company].join('^'); 
        } else {
            return "UPLOAD CONVERTER IS NOT SUPPORTED FOR THIS BADGE TYPE";
        }
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
        this.uploadPending().subscribe((data) => { }, (err) => { });
    }    

    // Re-upload all scans
    uploadAll() {
        return this.uploadPending(true);
    }

    // Uploading any pending scans
    uploadPending(all?) {
        if (!window.navigator.onLine) {
            return Observable.throw({error: true, msg: "Please check your internet connection.."});
        }
        const q = all ? 'error=no' : 'uploaded=no&error=no';
        return this.find(q)
            .flatMap((data) => {
                if (!data || data.length === 0) {
                    return Observable.throw({
                        error: true,
                        msg: "No pending uploads..."
                    });
                }
                return this.uploadToAssociation(data);
            })
            .flatMap((data) => {
                let leads = data,
                    requests = [],
                    i = 0,
                    len = leads.length;
                for(; i < len; i++) {
                    requests.push(this.uploadToValidar(leads[i]));
                }
                if (len === 0) {
                    return Observable.of([]);
                }
                return this.infoService.updateToken().flatMap(() => {
                    return Observable.forkJoin(requests);
                });
            });
    }

    // Upload to 3rd Party
    private uploadToAssociation(leads) {
        let leadsToUpload = [];
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('apikey', apiCreds.apiKey);
        let associateObj = {
            EventID: apiCreds.eventId,
            Mapping: []
        };
        for(let i = 0, j = leads.length; i < j; i++) {
            let person = this.convertLeadToMapObject(leads[i]);
            if (person) {
                associateObj.Mapping.push(person);
                leadsToUpload.push(leads[i]);
            }
        }        
        return this.http.post(this.turnoutURL, associateObj, { headers }).map(res => res.json())
        .flatMap((resp) => {
            if (resp.ResultCode !== 200) {
                return Observable.throw({
                    error: true,
                    msg: resp.Message
                });
            }
            return Observable.of(leadsToUpload);
        });
    }

    // Upload single lead to Validar
    private uploadToValidar(lead) {
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
                        return this.infoService.updateToken().flatMap(() => this.uploadToValidar(lead));
                    }
                    return Observable.throw(err);
                });
        });
    }

    // Convert database lead to mapping object to upload to 3rd party
    private convertLeadToMapObject(lead) {        
        let time = moment.utc(lead.LastVisitDateTime).toDate();
        const obj = {
            IsDeleted: 0,
            Badge: this.getTagValue(lead.Responses, 'lcConvertedBadge'),
            Beacon: this.getTagValue(lead.Responses, 'lcRFID'),
            Time: moment(time).format('YYYY-MM-DD HH:mm:ss.SSS')
        };

        if (obj.Badge && obj.Beacon ) {
            return obj;
        }
        return false;
    }

    // Helper to get 'Tag' value from Responses array
    private getTagValue(arr, tag) {
        let i = 0, j = arr.length;
        for (; i < j; i++) {
            if ("object" == typeof arr[i] && arr[i]['Tag'] === tag) {
                return arr[i].Value;
            }
        }
    }
}