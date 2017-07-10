import { Component } from '@angular/core';
import { Events, LoadingController, ToastController, AlertController } from "ionic-angular";

import { SettingsService } from '../../providers/settingsService';
import { InfoService } from '../../providers/infoService';
import { SaveService } from '../../providers/saveService';

import { apiCreds } from '../../config/apiCreds';
console.log(apiCreds);

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  aboutDevice : any = {
    apiKey: apiCreds.apiKey,
    eventId: apiCreds.eventId,
    appInfo: "",
    deviceInfo: "",
    scannerStatus: "disconnected",
    cameraFront: "checkmark",
    cameraBack: "checkmark"
  };

  pendingUploads : number = 23;

  constructor(
    private settingsService: SettingsService,
    private infoService: InfoService,
    private saveService: SaveService,
    private events: Events,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
  }

  // Build about section, subscribe to events
  ionViewWillEnter() {
    this.infoService.getClientInfo().subscribe((data) => {
      this.buildAboutSection();
    });
    this.buildAboutSection = this.buildAboutSection.bind(this);
    this.events.subscribe('event:onLineaConnect', this.buildAboutSection);
    this.getPendingCount();
  }

  // Unsubscribe from all events
  ionViewWillLeave() {
    this.events.unsubscribe('event:onLineaConnect', this.buildAboutSection);
  }

  // Upload pending scans
  uploadScans() {
    let loader = this.loadingCtrl.create({
      content: 'Uploading scans',
      dismissOnPageChange: true
    });
    loader.present();

    this.saveService.uploadPending(false).subscribe((data) => {
      console.log("DATA FROM UPLOADING");
      console.log(data);
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: 'Finished uploading scans!',
        duration: 2500,
        position: 'top'
      });
      toast.present();
      this.getPendingCount();
    }, (err) => {
      console.log("ERROR FROM UPLOADING");
      console.log(err);
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: err,
        duration: 2500,
        position: 'top'
      });
      toast.present();
      this.getPendingCount();
    });    
  }

  // Get About section
  buildAboutSection() {
    let a = this.aboutDevice;
    a.appInfo = this.infoService.getApplicationInformation();
    a.deviceInfo = this.infoService.getDeviceInformation();
    a.scannerStatus = (this.infoService.getLineaStatus()) ? 'connected' : 'disconnected';
    a.cameraFront = (this.infoService.getCameraStatus('FrontCamera')) ? 'checkmark' : 'close';
    a.cameraBack = (this.infoService.getCameraStatus('RearCamera')) ? 'checkmark' : 'close';
  }

  // Start new automatic upload time
  startNewUploadTime() {
    this.settingsService.storeCurrentSettings();
    this.saveService.initializeBackgroundUpload(this.settingsService.backgroundUploadWait);
  }

  // Save settings to local storage
  saveSettings() {
    this.settingsService.storeCurrentSettings();
  }

  // Edit User
  editUser() {
    let prompt = this.alertCtrl.create({
      title: 'Edit User',
      message: 'Please enter a name for this user.',
      inputs: [{
        name: 'user',
        placeholder: 'John Smith',
        value: this.settingsService.currentUser
      }],
      buttons: [
        {
          text: 'Cancel',
        }, {
          text: 'Save',
          handler: data => {
            this.settingsService.setValue(data.user, 'currentUser');
          }
        }
      ]
    });
    prompt.present();
  }

  // Get Pending Upload Count
  getPendingCount() {
    this.saveService.count('?uploaded=no').subscribe((data) => {      
        this.pendingUploads = data.Count;
    });
  }

  // Resync ALL Scans
  resyncAllScans() {
    let loader = this.loadingCtrl.create({
      content: 'Uploading all scans',
      dismissOnPageChange: true
    });
    loader.present();

    this.saveService.uploadAll().subscribe((data) => {
      console.log("DATA FROM UPLOADING");
      console.log(data);
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: 'Finished uploading everything!',
        duration: 2500,
        position: 'top'
      });
      toast.present();
      this.getPendingCount();
    }, (err) => {
      console.log("ERROR FROM UPLOADING");
      console.log(err);
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: err.msg || err,
        duration: 2500,
        position: 'top'
      });
      toast.present();
      this.getPendingCount();
    });
  }
}
