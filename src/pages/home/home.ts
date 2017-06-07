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
