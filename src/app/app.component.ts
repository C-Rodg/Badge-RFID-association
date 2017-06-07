import { Component, ViewChild } from '@angular/core';
import { Nav } from 'ionic-angular';

import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{title: string, component: any}>;

  constructor() {

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Associate', component: HomePage },
      { title: 'Settings', component: SettingsPage }
    ];

  }

  // Side Menu - Open Page
  openPage(page) {
    this.nav.setRoot(page.component);
  }
}
