import { Component } from '@angular/core';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  scanBadge: boolean = false;
  scanRFID: boolean = false;
  valueBadge: string = "";
  valueRFID: string = "";

  constructor() {

  }

  startScan() {
    // TESTING:
    let val = Math.round(Math.random());
    if (val) {
      this.scanBadge = true;
    } else {
      this.scanRFID = true;
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
