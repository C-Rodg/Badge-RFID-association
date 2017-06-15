import { Component, ViewChild, NgZone } from '@angular/core';
import { Nav, AlertController, Events } from 'ionic-angular';

import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';
import { InfoService } from '../providers/infoService';
import { SettingsService } from '../providers/settingsService';
import { ScanCameraService } from '../providers/scanCameraService';
import { ScanSledService } from '../providers/scanSledService';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{title: string, component: any}>;

  constructor(
      private infoService: InfoService,
      private settingsService: SettingsService,
      private scanCameraService: ScanCameraService,
      private scanSledService: ScanSledService,
      private alertCtrl: AlertController,
      private events: Events,
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
        let view = this.nav.getActive();
        if (view.instance instanceof SettingsPage) {
          this.events.publish('event:onLineaConnect');
        }
        if (this.settingsService.cameraMode) {
          if (view.instance instanceof HomePage) {
            this.scanCameraService.turnOff();
          }          
          let prompt = this.alertCtrl.create({
            title: 'Scanner Detected',
            message: 'Do you wish to shut off the camera and switch to sled mode?',
            buttons: [
              {
                text: 'Stay',
                handler: () => {
                  if (view.instance instanceof HomePage) {
                    this.scanCameraService.turnOn();
                  }
                }
              },
              {
                text: 'Switch',
                handler: () => {
                  this.settingsService.setValue(false, 'cameraMode');
                  if (view.instance instanceof HomePage) {
                    this.scanSledService.sendScanCommand('enableButtonScan');
                  } 
                }
              }
            ]
          });
          prompt.present();
        }
      });
    })
  }

  // Side Menu - Open Page
  openPage(page) {
    this.nav.setRoot(page.component);
  }

  // Side Menu Open
  sideMenuOpen() {
    if (this.settingsService.cameraMode) {
      this.scanCameraService.turnOff();
    }

  }

  // Side Menu Closed
  sideMenuClosed() {
    let view = this.nav.getActive();
    if (this.settingsService.cameraMode && view.instance instanceof HomePage) {
      setTimeout(function() {
        this.scanCameraService.turnOn();
      }.bind(this), 550);
    }
  }
}
