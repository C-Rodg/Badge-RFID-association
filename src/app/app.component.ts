import { Component, ViewChild, NgZone } from '@angular/core';
import { Nav, AlertController, Events, MenuController, LoadingController, ToastController } from 'ionic-angular';

import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';
import { InfoService } from '../providers/infoService';
import { SettingsService } from '../providers/settingsService';
import { ScanCameraService } from '../providers/scanCameraService';
import { ScanSledService } from '../providers/scanSledService';
import { SaveService } from '../providers/saveService';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;
  pages: Array<{ title: string, component: any, icon: string }>;
  pendingUploads: number = 0;
  currentlyUploading: boolean = false;

  constructor(
      private infoService: InfoService,
      private settingsService: SettingsService,
      private scanCameraService: ScanCameraService,
      private scanSledService: ScanSledService,
      private saveService: SaveService,
      private alertCtrl: AlertController,
      private events: Events,
      private zone: NgZone,
      private menuCtrl: MenuController,
      private loadingCtrl: LoadingController,
      private toastCtrl: ToastController
    ) {

    // Bind to OnLineaConnect
    (<any>window).OnLineaConnect = this.onZoneOnAppActive.bind(this);

    // Create sidemenu pages
    this.pages = [
      { title: 'Associate', component: HomePage, icon: 'code-working' },
      { title: 'Settings', component: SettingsPage, icon: 'settings' },
      { title: 'Upload Scans', component: '', icon: 'cloud-upload' },
      { title: 'Exit', component: '', icon: 'exit' }
    ];

    // Get initial device and lead source info, handle logging in
    this.infoService.startUpApplication().subscribe(() => {
      // Get Pending uploads
      this.getPendingCount();
    });

    // Start background uploading
    this.startBackgroundUpload();

    this.menuCtrl.swipeEnable(false);
  }

  // On Sled wake - CameraMode/HomePage: turn off camera, prompt to switch; !CameraMode/HomePage: enable button scan; SettingsPage: publish event
  onZoneOnAppActive() {
    this.zone.run(() => {
      this.infoService.getClientInfo().subscribe(() => {
        let view = this.nav.getActive();
        if (view.instance instanceof SettingsPage) {
          this.events.publish('event:onLineaConnect');
        } else if (view.instance instanceof HomePage && !this.settingsService.cameraMode) {
          this.scanSledService.sendScanCommand('enableButtonScan');
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
    // Exit application
    if (page.icon === 'exit') {
      window.location.href = "http://localhost/navigate/home";
      return false;
    } 
    // Upload pending scans
    else if (page.icon === 'cloud-upload') {
      this.currentlyUploading = true;
      let loader = this.loadingCtrl.create({
        content: 'Uploading scans...',
        dismissOnPageChange: true
      });
      loader.present();

      // Start uploading
      this.saveService.uploadPending().subscribe((data) => {
        loader.dismiss();
        this.currentlyUploading = false;
        let view = this.nav.getActive();
        if (view.instance instanceof HomePage && this.settingsService.cameraMode) {
          this.scanCameraService.turnOn();
        }
        let toast = this.toastCtrl.create({
          message: `Finished uploading scans!`,
          duration: 2500,
          position: 'top'
        });
        toast.present();
        this.getPendingCount();
      }, (err) => {
        loader.dismiss();
        this.currentlyUploading = false;
        let view = this.nav.getActive();
        if (view.instance instanceof HomePage && this.settingsService.cameraMode) {
          this.scanCameraService.turnOn();
        }
        const msg = err.msg ? err.msg : "There was an issue uploading scans..";
        let toast = this.toastCtrl.create({
          message: msg,
          duration: 2500,
          position: 'top'
        });
        toast.present();
        this.getPendingCount();
      });      
    } 
    // Navigate to HomePage or SettingsPage
    else {
      this.nav.setRoot(page.component);
    }    
  }

  // Side Menu Open
  sideMenuOpen() {
    this.getPendingCount();
    if (this.settingsService.cameraMode) {
      this.scanCameraService.turnOff();
    }
  }

  // Side Menu Closed
  sideMenuClosed() {
    let view = this.nav.getActive();
    if (this.settingsService.cameraMode && view.instance instanceof HomePage && !this.currentlyUploading) {
      setTimeout(function() {
        this.scanCameraService.turnOn();
      }.bind(this), 550);
    }
  }

  // Get Pending Upload Count
  getPendingCount() {
    this.saveService.count('?uploaded=no').subscribe((data) => {
      this.zone.run(() => {
        this.pendingUploads = data.Count;
      });
    });
  }

  // Start background upload
  startBackgroundUpload() {
    this.saveService.initializeBackgroundUpload(this.settingsService.backgroundUploadWait);
  }
}
