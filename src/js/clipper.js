import { Vector } from "./vector";
import { Vertex } from "./vertex";

const checkPlane = (plane, a, b, c, mask) => {
    let i = 0;
    let p = 0;
    if (plane.x * a.x + plane.y * a.y + plane.z * a.z > plane.w) {
        i |= mask;
        p |= 1;
    }
    if (plane.x * b.x + plane.y * b.y + plane.z * b.z > plane.w) {
        i |= mask;
        p |= 2;
    }
    if (plane.x * c.x + plane.y * c.y + plane.z * c.z > plane.w) {
        i |= mask;
        if (p === 3) {
            return -1;
        }
    }
    return i;
};

function interpolate(a, b, t, dst) {
    dst.texel.x = a.texel.x + t * (b.texel.x - a.texel.x);
    dst.texel.y = a.texel.y + t * (b.texel.y - a.texel.y);
    dst.texel.z = a.texel.z + t * (b.texel.z - a.texel.z);
    dst.texel.w = a.texel.w + t * (b.texel.w - a.texel.w);
    dst.coord.x = a.coord.x + t * (b.coord.x - a.coord.x);
    dst.coord.y = a.coord.y + t * (b.coord.y - a.coord.y);
    dst.coord.z = a.coord.z + t * (b.coord.z - a.coord.z);
    dst.coord.w = a.coord.w + t * (b.coord.w - a.coord.w);
    return dst;
}

class VertexCache {

    constructor() {
        this.index = 0;
        this.cache = [];
        for (let i = 0; i < 16; i++) {
            this.cache.push(new Vertex());
        }
        this.current = this.cache[0];
    }

    next() {
        return (this.current = this.cache[++this.index & 15]);
    };
}

export class Clipper {

    constructor() {
        this.a = new Array(12);
        this.b = new Array(12);
        this.acount = 0;
        this.bcount = 0;
        this.clipPlane0 = new Vector();
        this.clipPlane1 = new Vector();
        this.clipPlane2 = new Vector();
        this.clipPlane3 = new Vector();
        this.clipPlane4 = new Vector();
        this.clipPlane5 = new Vector();
        this.vertexCache = new VertexCache();
    }

    configure(camera) {
        const tmp = camera.temp;
        const vm = camera.view;
        const proj = camera.proj;
        this.clipPlane1.set(vm.e31 * proj.e22, vm.e32 * proj.e22, vm.e33 * proj.e22, 0.0);
        this.clipPlane0.set(vm.e31 * -proj.e22, vm.e32 * -proj.e22, vm.e33 * -proj.e22, 0.0);
        this.clipPlane4.set(vm.e11, vm.e12, vm.e13, 0.0).mul(camera.aspect).sub(tmp.set(vm.e21, vm.e22, vm.e23, 0.0)).add(this.clipPlane1);
        this.clipPlane5.set(vm.e11, vm.e12, vm.e13, 0.0).mul(-camera.aspect).add(tmp.set(vm.e21, vm.e22, vm.e23, 0.0)).add(this.clipPlane1);
        this.clipPlane3.cross(this.clipPlane4, tmp.set(vm.e21, vm.e22, vm.e23, 0.0));
        this.clipPlane4.cross(this.clipPlane4, tmp.set(vm.e11, vm.e12, vm.e13, 0.0));
        this.clipPlane2.cross(tmp.set(vm.e21, vm.e22, vm.e23, 0.0), this.clipPlane5);
        this.clipPlane5.cross(tmp.set(vm.e11, vm.e12, vm.e13, 0.0), this.clipPlane5);
        this.clipPlane0.w = this.clipPlane0.dot(tmp.set(vm.e31, vm.e32, vm.e33, 0.0).mul(camera.near).add(camera.eye));
        this.clipPlane1.w = this.clipPlane1.dot(tmp.set(vm.e31, vm.e32, vm.e33, 0.0).mul(camera.far).add(camera.eye));
        this.clipPlane2.w = this.clipPlane2.dot(camera.eye);
        this.clipPlane3.w = this.clipPlane3.dot(camera.eye);
        this.clipPlane4.w = this.clipPlane4.dot(camera.eye);
        this.clipPlane5.w = this.clipPlane5.dot(camera.eye);
    }

    computeMask(v0, v1, v2) {
        let mask = 0;
        if ((mask |= checkPlane(this.clipPlane0, v0.coord, v1.coord, v2.coord, 0x01)) < 0) return mask;
        if ((mask |= checkPlane(this.clipPlane1, v0.coord, v1.coord, v2.coord, 0x02)) < 0) return mask;
        if ((mask |= checkPlane(this.clipPlane2, v0.coord, v1.coord, v2.coord, 0x04)) < 0) return mask;
        if ((mask |= checkPlane(this.clipPlane3, v0.coord, v1.coord, v2.coord, 0x08)) < 0) return mask;
        if ((mask |= checkPlane(this.clipPlane4, v0.coord, v1.coord, v2.coord, 0x10)) < 0) return mask;
        if ((mask |= checkPlane(this.clipPlane5, v0.coord, v1.coord, v2.coord, 0x20)) < 0) return mask;
        return mask;
    }

    clip(v0, v1, v2, mask) {
        this.bcount = 0;
        this.acount = 3;
        this.a[0] = this.vertexCache.next().copy(v0);
        this.a[1] = this.vertexCache.next().copy(v1);
        this.a[2] = this.vertexCache.next().copy(v2);
        this.a[3] = this.a[0];
        return (mask & 0x01) !== 0 && this.evalPlane(this.clipPlane0) ||
            (mask & 0x02) !== 0 && this.evalPlane(this.clipPlane1) ||
            (mask & 0x04) !== 0 && this.evalPlane(this.clipPlane2) ||
            (mask & 0x08) !== 0 && this.evalPlane(this.clipPlane3) ||
            (mask & 0x10) !== 0 && this.evalPlane(this.clipPlane4) ||
            (mask & 0x20) !== 0 && this.evalPlane(this.clipPlane5);
    }

    evalPlane(plane) {
        let a2;
        let a1 = this.a[0];
        for (let v = 1; v <= this.acount; v++) {
            a2 = this.a[v];
            const dot = -plane.side(a1.coord);
            if (dot > 0.0) {
                if (plane.side(a2.coord) < 0) {
                    this.b[this.bcount++] = a2;
                } else {
                    const t = dot / plane.intersect(a1.coord, a2.coord);
                    this.b[this.bcount++] = interpolate(a1, a2, t, this.vertexCache.next());
                }
            } else {
                if (plane.side(a2.coord) < 0) {
                    const t = dot / plane.intersect(a1.coord, a2.coord);
                    this.b[this.bcount++] = interpolate(a1, a2, t, this.vertexCache.next());
                    this.b[this.bcount++] = a2;
                }
            }
            a1 = a2;
        }

        if (this.bcount < 3) {
            return true;
        }

        this.b[this.bcount] = this.b[0];
        [this.acount, this.bcount] = [this.bcount, 0];
        [this.a, this.b] = [this.b, this.a];
        return false;
    }
}
