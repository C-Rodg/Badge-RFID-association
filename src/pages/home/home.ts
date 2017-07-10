import { Component, NgZone } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { SoundService } from '../../providers/soundService';
import { ScanSledService } from '../../providers/scanSledService';
import { ScanCameraService } from '../../providers/scanCameraService';
import { ParseBadgeService } from '../../providers/parseBadgeService';
import { SettingsService } from '../../providers/settingsService';
import { InfoService } from '../../providers/infoService';
import { SaveService } from '../../providers/saveService';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  valueBadge: string = "";
  fullBadge: string = "";
  valueRFID: string = "";

  constructor(
    private settingsService: SettingsService,
    private scanSledService: ScanSledService,
    private scanCameraService: ScanCameraService,
    private parseBadgeService: ParseBadgeService,
    private saveService: SaveService,
    private soundService: SoundService,
    private infoService: InfoService,
    private zone: NgZone,
    private toastCtrl: ToastController
  ) {

  }

  // Bind OnDataRead to component, enable sled scanning or turn on camera
  ionViewDidEnter() {
    (<any>window).OnDataRead = this.onScan.bind(this);

    if (!this.settingsService.cameraMode) {
      this.scanSledService.sendScanCommand('enableButtonScan');
    } else {
      this.scanCameraService.calculatePosition();
      this.scanCameraService.turnOn();
    } 
  }

  // Shut off camera if leaving
  ionViewWillLeave() {
    if (this.settingsService.cameraMode) {
      this.scanCameraService.turnOff();
    }
  }

  // Disallow scanning on other pages
  ionViewDidLeave() {
    (<any>window).OnDataRead = function() {};
  }

  // Scan Registered
  onScan(data) {
    this.zone.run(() => {
      // Determine if badgeId or wireless device, if both scanned associate and save
      this.parseBadgeService.parse(data).subscribe((d) => {
        
        // Assign new scan data
        if (d.type === 'BADGE') {
          this.valueBadge = d.val;
          this.fullBadge = d.full;
        } else if (d.type === 'RFID') {
          this.valueRFID = d.val;
        } else {          
          this.soundService.playDenied();
          alert("Uh-Oh! There seems to be an issue parsing the badge..");
          return false;
        }

        // Play scan noise
        this.soundService.playScan();

        // Check if both scans are present
        if (this.valueBadge && this.valueRFID && this.fullBadge) {
          // Save data and play accepted noise
          const saveObj = {
            badge: this.valueBadge,
            rfid: this.valueRFID,
            fullBadge: this.fullBadge,
            station: this.infoService.client.ClientName,
            device: this.infoService.client.DeviceType,
            user: this.settingsService.currentUser || this.infoService.client.ClientName
          };

          this.saveService.startSave(saveObj).subscribe((data) => {
          }, (err) => {
            alert("Uh-Oh! We're having issues saving..")
          });

          setTimeout(function() {
            this.soundService.playAccepted();
          }.bind(this), 800);
          setTimeout(function() {
            this.resetScans();
          }.bind(this), 2000);
        }

      }, (err) => {
        alert("Uh-Oh! We're having issues parsing the barcode..");
      });
    });
  }

  // Scan Button touch start/end
  scanBtnClicked(event, status) {
    if (status) {
      this.scanSledService.sendScanCommand('startScan');
    } else {
      this.scanSledService.sendScanCommand('stopScan');
    }
  }  

  // Reset RFID & BadgeID values
  resetScans() {
    this.valueBadge = "";
    this.valueRFID = "";
  } 

  // Toggle Torch
  toggleTorch() {
    this.scanCameraService.toggleTorch();
  }

  // Toggle Camera
  toggleCamera() {
    this.scanCameraService.toggleCamera();
  }

}
