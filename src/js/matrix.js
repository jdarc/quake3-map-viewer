export class Matrix {
    constructor(e11 = 0.0, e12 = 0.0, e13 = 0.0, e14 = 0.0,
                e21 = 0.0, e22 = 0.0, e23 = 0.0, e24 = 0.0,
                e31 = 0.0, e32 = 0.0, e33 = 0.0, e34 = 0.0,
                e41 = 0.0, e42 = 0.0, e43 = 0.0, e44 = 0.0) {
        this.e11 = e11;
        this.e12 = e12;
        this.e13 = e13;
        this.e14 = e14;
        this.e21 = e21;
        this.e22 = e22;
        this.e23 = e23;
        this.e24 = e24;
        this.e31 = e31;
        this.e32 = e32;
        this.e33 = e33;
        this.e34 = e34;
        this.e41 = e41;
        this.e42 = e42;
        this.e43 = e43;
        this.e44 = e44;
    }

    static concatenate(lhs, rhs, dst = new Matrix()) {
        const e11 = lhs.e11 * rhs.e11 + lhs.e12 * rhs.e21 + lhs.e13 * rhs.e31 + lhs.e14 * rhs.e41;
        const e12 = lhs.e11 * rhs.e12 + lhs.e12 * rhs.e22 + lhs.e13 * rhs.e32 + lhs.e14 * rhs.e42;
        const e13 = lhs.e11 * rhs.e13 + lhs.e12 * rhs.e23 + lhs.e13 * rhs.e33 + lhs.e14 * rhs.e43;
        const e14 = lhs.e11 * rhs.e14 + lhs.e12 * rhs.e24 + lhs.e13 * rhs.e34 + lhs.e14 * rhs.e44;
        const e21 = lhs.e21 * rhs.e11 + lhs.e22 * rhs.e21 + lhs.e23 * rhs.e31 + lhs.e24 * rhs.e41;
        const e22 = lhs.e21 * rhs.e12 + lhs.e22 * rhs.e22 + lhs.e23 * rhs.e32 + lhs.e24 * rhs.e42;
        const e23 = lhs.e21 * rhs.e13 + lhs.e22 * rhs.e23 + lhs.e23 * rhs.e33 + lhs.e24 * rhs.e43;
        const e24 = lhs.e21 * rhs.e14 + lhs.e22 * rhs.e24 + lhs.e23 * rhs.e34 + lhs.e24 * rhs.e44;
        const e31 = lhs.e31 * rhs.e11 + lhs.e32 * rhs.e21 + lhs.e33 * rhs.e31 + lhs.e34 * rhs.e41;
        const e32 = lhs.e31 * rhs.e12 + lhs.e32 * rhs.e22 + lhs.e33 * rhs.e32 + lhs.e34 * rhs.e42;
        const e33 = lhs.e31 * rhs.e13 + lhs.e32 * rhs.e23 + lhs.e33 * rhs.e33 + lhs.e34 * rhs.e43;
        const e34 = lhs.e31 * rhs.e14 + lhs.e32 * rhs.e24 + lhs.e33 * rhs.e34 + lhs.e34 * rhs.e44;
        const e41 = lhs.e41 * rhs.e11 + lhs.e42 * rhs.e21 + lhs.e43 * rhs.e31 + lhs.e44 * rhs.e41;
        const e42 = lhs.e41 * rhs.e12 + lhs.e42 * rhs.e22 + lhs.e43 * rhs.e32 + lhs.e44 * rhs.e42;
        const e43 = lhs.e41 * rhs.e13 + lhs.e42 * rhs.e23 + lhs.e43 * rhs.e33 + lhs.e44 * rhs.e43;
        const e44 = lhs.e41 * rhs.e14 + lhs.e42 * rhs.e24 + lhs.e43 * rhs.e34 + lhs.e44 * rhs.e44;
        dst.e11 = e11;
        dst.e12 = e12;
        dst.e13 = e13;
        dst.e14 = e14;
        dst.e21 = e21;
        dst.e22 = e22;
        dst.e23 = e23;
        dst.e24 = e24;
        dst.e31 = e31;
        dst.e32 = e32;
        dst.e33 = e33;
        dst.e34 = e34;
        dst.e41 = e41;
        dst.e42 = e42;
        dst.e43 = e43;
        dst.e44 = e44;
        return dst;
    }

    static createViewport(width, height, dst = new Matrix()) {
        dst.e12 = dst.e13 = dst.e21 = dst.e23 = dst.e31 = dst.e32 = dst.e34 = dst.e41 = dst.e42 = dst.e43 = 0.0;
        dst.e11 = width * 0.5;
        dst.e22 = height * 0.5;
        dst.e14 = dst.e11 - 0.5;
        dst.e24 = dst.e22 - 0.5;
        dst.e33 = dst.e44 = 1.0;
        return dst;
    }

    static createLookAt(eye, at, dst = new Matrix()) {
        const x = at.x - eye.x;
        const y = at.y - eye.y;
        const z = at.z - eye.z;
        const s = 1.0 / Math.sqrt(x * x + y * y + z * z);
        dst.e31 = x * s;
        dst.e32 = y * s;
        dst.e33 = z * s;
        const s2 = 1.0 / Math.sqrt(dst.e31 * dst.e31 + dst.e33 * dst.e33);
        dst.e11 = dst.e33 * s2;
        dst.e13 = -dst.e31 * s2;
        dst.e21 = -dst.e13 * dst.e32;
        dst.e22 = dst.e13 * dst.e31 - dst.e11 * dst.e33;
        dst.e23 = dst.e11 * dst.e32;
        dst.e14 = -(eye.x * dst.e11 + eye.z * dst.e13);
        dst.e24 = -(eye.x * dst.e21 + eye.y * dst.e22 + eye.z * dst.e23);
        dst.e34 = -(eye.x * dst.e31 + eye.y * dst.e32 + eye.z * dst.e33);
        dst.e44 = 1.0;
        dst.e12 = dst.e41 = dst.e42 = dst.e43 = 0.0;
        return dst;
    }

    static createPerspectiveFov(fov, aspectRatio, near, far, dst = new Matrix()) {
        dst.e12 = dst.e13 = dst.e14 = dst.e21 = dst.e23 = dst.e24 = dst.e31 = dst.e32 = dst.e41 = dst.e42 = dst.e44 = 0.0;
        dst.e22 = 1.0 / Math.tan(fov / 2.0);
        dst.e11 = dst.e22 / aspectRatio;
        dst.e33 = far / (far - near);
        dst.e34 = -dst.e33 * near;
        dst.e43 = 1.0;
        return dst
    }
}
