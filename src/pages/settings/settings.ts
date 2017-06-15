import { Component } from '@angular/core';
import { Events, LoadingController, ToastController } from "ionic-angular";

import { SettingsService } from '../../providers/settingsService';
import { InfoService } from '../../providers/infoService';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  aboutDevice : any = {
    appInfo: "",
    deviceInfo: "",
    scannerStatus: "disconnected",
    cameraFront: "checkmark",
    cameraBack: "checkmark"
  };

  pendingUpload : number = 0;

  constructor(
    private settingsService: SettingsService,
    private infoService: InfoService,
    private events: Events,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
  }

  // Build about section, subscribe to events
  ionViewWillEnter() {
    this.infoService.getClientInfo().subscribe((data) => {
      this.buildAboutSection();
    });
    this.buildAboutSection = this.buildAboutSection.bind(this);
    this.events.subscribe('event:onLineaConnect', this.buildAboutSection);
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
    
    // TODO: TESTING - UPLOAD SCANS HERE
    setTimeout(function() {
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: 'All scans uploaded!',
        duration: 2000,
        position: 'top'
      });
      toast.present();
    }.bind(this), 2500);
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
    // TODO: START NEW UPLOAD TIME IN SERVICE
  }

  // Save settings to local storage
  saveSettings() {
    this.settingsService.storeCurrentSettings();
  }
}
