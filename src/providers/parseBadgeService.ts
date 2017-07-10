import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Injectable() 
export class ParseBadgeService {
    constructor() {}

    // Parse barcode and determine type of 'BADGE' or 'RFID'
    parse(d) {
        let checkSymbology = null,
            symbology = null,
            scannerSource = null,
            scannedData = null;
        
        symbology = d[0].Symbology;
        scannerSource = d[0].Source;
        if ( scannerSource.indexOf('Camera') > -1) {
            scannedData = d[0].Data;
        } else {
            scannedData = this.decode_utf8(d[0].Data);
        }
        
        checkSymbology = symbology;
        if (checkSymbology != null) {
            checkSymbology = checkSymbology.replace(/\s+/g, '').toUpperCase();
        }

        if (checkSymbology === 'CODE3OF9' || checkSymbology === 'CODE39') {
            return this.parse39(scannedData);
        } else if (checkSymbology === 'QRCODE') {
            return this.parseQR(scannedData);
        } else if (checkSymbology === 'PDF417') {
            return this.parsePDF417(scannedData);
        } else if (checkSymbology === 'CODE128') {
            return this.throwError('Code 128 badges are not supported');
        } else if (checkSymbology === 'AZTEK') {
            return this.throwError('Aztek badges are not supported');
        } else {
            return this.throwError('Unsupported badge type');
        }
    }

    // Parse PDF 417 badges -- assuming RFID will never be PDF417
    private parsePDF417(scannedData) {
        let scannedFields = scannedData.split(';');
        if (scannedFields.length > 0 && scannedFields[0]) {     // Assuming badgeId is index 0
            return Observable.of({
                type: 'BADGE',
                val: scannedFields[0],
                full: scannedData
            });
        }
        return this.throwError("Empty PDF417");
    }

    // Parse 3 of 9 badges -- assuming RFID will never be 3 of 9, only Validar badges
    private parse39(scannedData) {
        if (scannedData != null) {
            return Observable.of({
                type: 'BADGE',
                val: scannedData,
                full: scannedData
            });
        }
        return this.throwError('Empty 3 of 9 barcode');
    }

    // Parse QR code
    private parseQR(scannedData) {
        let scannedFields = null;
        
        if (scannedData != null && scannedData.substring(0,4) === 'VQC:') {     // Validar QR code (badge)
            let scannedStr = scannedData.substring(4);
            scannedFields = scannedStr.split(';');
            if (scannedFields != null) {
                for (let i = 0, j = scannedFields.length; i < j; i++) {
                    let field = scannedFields[i].split(':');
                    if (field != null && field.length > 0) {
                        if (field[0] === 'ID') {
                            return Observable.of({
                                type: 'BADGE',
                                val: field[1],
                                full: scannedData
                            });
                        }
                    }
                }
            }
            return this.throwError('Invalid Validar badge');
        } else if (scannedData != null && (scannedData.match(/;/g) || []).length >= 2) {    // Other split QR codes (badge), assuming badgeId index is 0
            scannedFields = scannedData.split(';');
            if (scannedFields != null) {
                return Observable.of({
                    type: 'BADGE',
                    val: scannedFields[0],
                    full: scannedData
                });
            }
            return this.throwError('Invalid QR code format');
        } else if (scannedData != null) {                   // QR code not split (rfid)
            // TODO: include prefix search for RFID?
            return Observable.of({
                type: "RFID",
                val: scannedData
            });
        } else {
            return this.throwError('Empty QR code');
        }
    }

    // Helper - throw observable error
    private throwError(msg) {
        return Observable.throw({
            error: true,
            message : msg
        });
    }

    // Helper - properly escapes values
    private decode_utf8(s) {
        return decodeURIComponent((<any>window).escape(s));
    }
}