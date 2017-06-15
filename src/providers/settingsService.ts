import { Injectable } from '@angular/core';
import { LeadSourceGuid } from '../helpers/leadSourceGuid';

@Injectable()
export class SettingsService {
    backgroundUploadWait: number = 3;
    cameraMode: boolean = true;

    constructor() {
        let settings = this.loadStoredSettings();
        if (settings) {
            this.assignSettings(settings);
        }
    }

    // Set primitive setting value
    setValue(val, prop) {
        this[prop] = val;
        this.storeCurrentSettings();
    }

    // Store current settings to local storage
    storeCurrentSettings() {
        const settings = {
            backgroundUploadWait: this.backgroundUploadWait,
            cameraMode: this.cameraMode
        };
        const settingsStr = JSON.stringify(settings);
        window.localStorage.setItem(LeadSourceGuid.guid, settingsStr);
    }

    // Load stored settings from local storage
    loadStoredSettings() {
        const settingsStr = window.localStorage.getItem(LeadSourceGuid.guid);
        try {
            return JSON.parse(settingsStr);
        } catch (e) {
            return null;
        }
    }

    // Assign Settings to 'this' instance
    assignSettings(settings) {
        for (let prop in settings) {
            if (settings.hasOwnProperty(prop) && this.hasOwnProperty(prop)) {
                this[prop] = settings[prop];
            }
        }
    }
}