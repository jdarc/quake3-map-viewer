import { Vector } from "./vector";
import { Matrix } from "./matrix";

export class Camera {

    constructor(fov, width, height, near, far) {
        this.aspect = width / height;
        this.near = near;
        this.far = far;
        this.temp = new Vector();
        this.eye = new Vector(0.0, 0.0, -1.0, 0.0);
        this.at = new Vector();
        this.view = new Matrix();
        this.proj = Matrix.createPerspectiveFov(fov, this.aspect, near, far);
        this.dirty = true;
    }

    get yaw() {
        return Math.atan2(-this.viewMatrix.e31, -this.viewMatrix.e33);
    }

    get pitch() {
        return -Math.asin(this.viewMatrix.e32);
    }

    get position() {
        return this.eye;
    }

    get viewMatrix() {
        if (this.dirty) {
            Matrix.createLookAt(this.eye, this.at, this.view);
            this.dirty = false;
        }
        return this.view;
    }

    get projectionMatrix() {
        return this.proj;
    }

    moveTo(x, y, z) {
        this.eye.set(x, y, z);
        this.dirty = true;
    }

    lookAt(x, y, z) {
        this.at.set(x, y, z);
        this.dirty = true;
    }
}
