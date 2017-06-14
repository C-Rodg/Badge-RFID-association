import { Component, ViewChild, NgZone } from '@angular/core';
import { Nav } from 'ionic-angular';

import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';
import { InfoService } from '../providers/infoService';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{title: string, component: any}>;

  constructor(
      private infoService: InfoService,
      private zone: NgZone
    ) {

    // Bind to OnLineaConnect
    (<any>window).OnLineaConnect = this.onZoneOnAppActive.bind(this);

    // Create sidemenu pages
    this.pages = [
      { title: 'Associate', component: HomePage },
      { title: 'Settings', component: SettingsPage }
    ];

    // Get initial device and lead source info
    this.getDeviceInfo();
  }

  // Get lead source and client info
  getDeviceInfo() {
    this.infoService.getClientInfo().subscribe((d) => {

    });
    this.infoService.getLeadSource().subscribe((r) => {

    });
  }

  // On Sled wake
  onZoneOnAppActive() {
    this.zone.run(() => {
      this.infoService.getClientInfo().subscribe(() => {

      });
    })
  }

  // Side Menu - Open Page
  openPage(page) {
    this.nav.setRoot(page.component);
  }
}
