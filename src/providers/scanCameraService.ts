import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable() 
export class ScanCameraService {
    private camera = {
        visible: "YES",
        camera: "BACK",
        top: 62,
        left: 0,
        width: 320,
        height: 456
    };
    private endpoint : string = "http://localhost/barcodecontrol";
    private cameraOn : boolean = false;
    public torch : string = "OFF";

    constructor(private http: Http) {
        this.calculatePosition = this.calculatePosition.bind(this);
        this.calculatePosition();
        window.addEventListener('orientationchange', () => {
            setTimeout(this.calculatePosition, 700);
        }, false);
    }

    // Calculate position for camera
    calculatePosition() {
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        this.camera.width = width;
        const target = document.getElementById('status-container');
        if (target) {
            const coords = target.getBoundingClientRect();
            if (coords) {
                this.camera.top = coords.top + 20;
                this.camera.height = coords.height;
            } else {
                this.camera.top = 62;
                this.camera.height = 300;
            }
        } else {
            this.camera.top = 62;
            this.camera.height = 300;
        }

        if (this.cameraOn) {
            this.turnOn();
        }
    }

    // Turn on camera
    turnOn() {
        this.cameraOn = true;
        this.http.post(this.endpoint, this.camera).map(res => res.json()).subscribe((data) => {});
    }

    // Turn off camera
    turnOff() {
        this.cameraOn = false;
        this.http.post(this.endpoint, {visible: "NO"}).map(res => res.json()).subscribe((data) => {});
    }

    // Toggle Camera
    toggleCamera() {
        this.camera.camera = (this.camera.camera === 'FRONT') ? 'BACK' : 'FRONT';
        this.http.post(this.endpoint, this.camera).map(res => res.json()).subscribe(data => {});
    }

    // Toggle torch
    toggleTorch() {
        this.torch = (this.torch === 'OFF') ? 'ON' : 'OFF';
        this.http.post(this.endpoint, {torch: this.torch}).map(res => res.json()).subscribe(data => {});
    }
}