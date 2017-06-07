import { Injectable } from '@angular/core';
import { Howl } from 'howler';
import { deny } from '../sounds/deny';
import { accept } from '../sounds/accept';
import { scan } from '../sounds/scan';

@Injectable()
export class SoundService {
    accept: any;
    deny: any;
    scan: any;

    constructor() {        

        this.accept = new Howl({
            src: [accept],
            autoplay: false,
            loop: false,
            volume: 0.6
        });
        this.scan = new Howl({
            src: [scan],
            autoplay: false,
            loop: false,
            volume: 0.6
        });
        this.deny = new Howl({
            src: [deny],
            autoplay: false,
            loop: false,
            volume: 0.7
        });
    }

    // Play scan noise
    public playScan() {
        this.scan.play();
    }
    
    // Play accepted noise
    public playAccepted() {
        this.accept.play();
    }

    // Play denied noise
    public playDenied() {
        this.deny.play();
    }
}