import { Component } from '@angular/core';
import { SoundService } from '../../providers/soundService';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  scanBadge: boolean = false;
  scanRFID: boolean = false;
  valueBadge: string = "";
  valueRFID: string = "";

  constructor(private soundService: SoundService) {

  }

  startScan() {
    // TESTING:
    let val = Math.round(Math.random());
    if (val) {
      this.scanBadge = true;
    } else {
      this.scanRFID = true;
    }

    if (this.scanBadge && this.scanRFID) {
      this.soundService.playAccepted();
      setTimeout(function(){
        this.resetScans();
      }.bind(this), 3000);
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
