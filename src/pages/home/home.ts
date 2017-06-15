import { Component, NgZone } from '@angular/core';
import { SoundService } from '../../providers/soundService';
import { ScanSledService } from '../../providers/scanSledService';
import { ParseBadgeService } from '../../providers/parseBadgeService';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  valueBadge: string = "";
  valueRFID: string = "";

  constructor(
    private scanSledService: ScanSledService,
    private parseBadgeService: ParseBadgeService,
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
      this.parseBadgeService.parse(data).subscribe((d) => {
        
        // Assign new scan data
        if (d.type === 'BADGE') {
          this.valueBadge = d.val;
        } else if (d.type === 'RFID') {
          this.valueRFID = d.val;
        } else {
          // Throw error for unknown type...
          this.soundService.playDenied();
          return false;
        }

        // Play scan noise
        this.soundService.playScan();

        // Check if both scans are present
        if (this.valueBadge && this.valueRFID) {
          // Save data and play accepted noise
          setTimeout(function() {
            this.soundService.playAccepted();
          }.bind(this), 800);
          setTimeout(function() {
            this.resetScans();
          }.bind(this), 2000);
        }

      }, (err) => {
        alert(JSON.stringify(err));
      })
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

}
