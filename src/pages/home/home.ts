import { Component, NgZone } from '@angular/core';
import { SoundService } from '../../providers/soundService';
import { ScanSledService } from '../../providers/scanSledService';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  scanBadge: boolean = false;
  scanRFID: boolean = false;
  valueBadge: string = "";
  valueRFID: string = "";

  constructor(
    private scanSledService: ScanSledService,
    private soundService: SoundService,
    private zone: NgZone,
  ) {

  }

  ionViewWillEnter() {

  }

  // Bind OnDataRead to component, enable sled scanning
  ionViewDidEnter() {
    (<any>window).OnDataRead = this.onScan.bind(this);
    this.scanSledService.sendScanCommand('enableButtonScan');
  }

  // Disallow scanning on other pages
  ionViewDidLeave() {
    (<any>window).OnDataRead = function() {};
  }

  // Scan Registered
  onScan(data) {
    let scanData = data;
    this.zone.run(() => {
      // Determine if badgeId or wireless device, if both scanned associate and save
    });
  }

  startScan() {
    // TESTING:
    if (!this.scanBadge) {
      this.scanBadge = true;
      this.soundService.playScan();
    } else {
      this.scanRFID = true;
      this.soundService.playScan();
    }

    if (this.scanBadge && this.scanRFID) {
      setTimeout(function() {
        this.soundService.playAccepted();
      }.bind(this), 800);      
      setTimeout(function(){
        this.resetScans();
      }.bind(this), 2000);
    }
  }

  // Reset RFID & BadgeID values
  resetScans() {
    this.scanBadge = false;
    this.scanRFID = false;
    this.valueBadge = "";
    this.valueRFID = "";
  }

}
