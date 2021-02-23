import '../css/main.css';

import { Vector } from "./vector";
import { Camera } from "./camera";
import { Surface } from "./surface";
import { Visualiser } from "./visualiser";
import { Quake3MapLoader } from "./quake3MapLoader";

class Demo {
    constructor() {
        let surface = null;
        let render = null;
        let camera = null;
        let movementMask = 0;
        const lookAt = new Vector();
        const camPos = new Vector();
        const oldPos = new Vector();
        let lastMouseXPos = 0;
        let lastMouseYPos = 0;
        let yaw = 0;
        let pitch = 0;
        let moving = false;
        let time1 = 0;
        let time2 = 0;
        let q3map = null;

        function init() {
            const canvas = document.createElement("canvas");
            canvas.width = document.body.offsetWidth >>> 1;
            canvas.height = document.body.offsetHeight >>> 1;
            document.body.appendChild(canvas);
            surface = new Surface(canvas);
            surface.drawString("Please wait, loading...");
            render = new Visualiser(surface);

            camera = new Camera(Math.PI / 4.0, surface.width, surface.height, 10, 5000);
            camPos.set(200, 100, -1200, 1);
            lookAt.set(480, 100, -1000, 1).sub(camPos).norm();
            camera.moveTo(camPos.x, camPos.y, camPos.z);
            camera.lookAt(camPos.x + lookAt.x, camPos.y + lookAt.y, camPos.z + lookAt.z);
            yaw = camera.yaw;
            pitch = camera.pitch;

            document.addEventListener('selectstart', () => false);
            document.onkeydown = function(event) {
                switch (String.fromCharCode(event.keyCode).toLowerCase()) {
                    case 'w':
                        movementMask |= 1;
                        break;
                    case 's':
                        movementMask |= 2;
                        break;
                    case 'a':
                        movementMask |= 4;
                        break;
                    case 'd':
                        movementMask |= 8;
                        break;
                }
                return true;
            };
            document.onkeyup = function(event) {
                switch (String.fromCharCode(event.keyCode).toLowerCase()) {
                    case 'w':
                        movementMask ^= 1;
                        break;
                    case 's':
                        movementMask ^= 2;
                        break;
                    case 'a':
                        movementMask ^= 4;
                        break;
                    case 'd':
                        movementMask ^= 8;
                        break;
                }
                return false;
            };
            document.onmousedown = function() {
                moving = true;
                return false;
            };
            document.onmouseup = function() {
                moving = false;
                return false;
            };
            document.onmousemove = function(event) {
                if (moving) {
                    yaw += (event.clientX - lastMouseXPos) * 0.01;
                    pitch = Math.min(1.57, Math.max(-1.57, pitch - (event.clientY - lastMouseYPos) * 0.01));

                    lookAt.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))
                }
                lastMouseXPos = event.clientX;
                lastMouseYPos = event.clientY;
                return false;
            };

            new Quake3MapLoader().load("maps/q3dm7.bsp", map => {
                q3map = map;
                window.requestAnimationFrame(loop);
            });
        }

        function loop(tick) {
            window.requestAnimationFrame(loop);

            const seconds = (tick - time1) / 1000.0;
            time1 = tick;

            oldPos.copy(camPos);
            if ((movementMask & 1) === 1) {
                camPos.add(new Vector().set(lookAt.x, lookAt.y, lookAt.z, lookAt.w).mul(seconds * 300));
            } else if ((movementMask & 2) === 2) {
                camPos.sub(new Vector().set(lookAt.x, lookAt.y, lookAt.z, lookAt.w).mul(seconds * 300));
            }

            const side = new Vector().cross(new Vector().set(0, 1, 0, 1), lookAt).norm().mul(seconds * 300);
            if ((movementMask & 4) === 4) {
                camPos.sub(side);
            } else if ((movementMask & 8) === 8) {
                camPos.add(side);
            }

            camPos.copy(q3map.traceSphere(oldPos, camPos, 20.0));

            camera.moveTo(camPos.x, camPos.y, camPos.z);
            const v = new Vector().set(camPos.x, camPos.y, camPos.z, camPos.w).add(lookAt);
            camera.lookAt(v.x, v.y, v.z);

            render.setCamera(camera);
            render.clear();
            q3map.drawMap(render, camera.position);
            surface.update();
        }

        this.run = function() {
            time2 = new Date().getTime();
            init();
        }
    }
}

window.addEventListener('load', () => new Demo().run());
