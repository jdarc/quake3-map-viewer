export class Vector {

    constructor(x = 0.0, y = 0.0, z = 0.0, w = 1.0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    set(x, y, z, w = 1.0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    norm() {
        return this.mul(1.0 / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
    }

    copy(other) {
        return this.set(other.x, other.y, other.z, other.w);
    }

    add(other) {
        return this.set(this.x + other.x, this.y + other.y, this.z + other.z, this.w);
    }

    sub(other) {
        return this.set(this.x - other.x, this.y - other.y, this.z - other.z, this.w);
    }

    mul(s) {
        return this.set(this.x * s, this.y * s, this.z * s, this.w);
    }

    swizzle() {
        const t = this.y;
        this.y = this.z;
        this.z = t;
        return this;
    }

    side(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z - this.w;
    }

    intersect(v1, v2) {
        return (v2.x - v1.x) * this.x + (v2.y - v1.y) * this.y + (v2.z - v1.z) * this.z;
    }

    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    cross(a, b) {
        return this.set(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x, this.w);
    }

    transform(m) {
        const x = m.e11 * this.x + m.e12 * this.y + m.e13 * this.z + m.e14 * this.w;
        const y = m.e21 * this.x + m.e22 * this.y + m.e23 * this.z + m.e24 * this.w;
        const z = m.e31 * this.x + m.e32 * this.y + m.e33 * this.z + m.e34 * this.w;
        const w = m.e41 * this.x + m.e42 * this.y + m.e43 * this.z + m.e44 * this.w;
        return this.set(x / w, y / w, z / w, w);
    }
}
