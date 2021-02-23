import { Matrix } from "./matrix";
import { Edge } from "./edge";
import { Vertex } from "./vertex";
import { Clipper } from "./clipper";
import { Gradients } from "./gradients";

const OPAQUE = 255 << 24;

const clamp = x => x < 256 ? x : 255;

export class Visualiser {

    constructor(surface) {
        const viewportMatrix = Matrix.createViewport(surface.width, surface.height);
        const colorBuffer = new Uint32Array(surface.data.buffer);
        const depthBuffer = new Float32Array(colorBuffer.length);
        const clipper = new Clipper();
        const gradients = new Gradients()
        const edge0 = new Edge();
        const edge1 = new Edge();
        const edge2 = new Edge();
        const transform = new Matrix();
        const rv0 = new Vertex();
        const rv1 = new Vertex();
        const rv2 = new Vertex();
        let colorMap;
        let lightMap;

        this.useColorMap = texture => colorMap = texture

        this.useLightMap = texture => lightMap = texture

        this.setCamera = camera => {
            Matrix.concatenate(camera.projectionMatrix, camera.viewMatrix, transform);
            Matrix.concatenate(viewportMatrix, transform, transform);
            clipper.configure(camera);
        };

        this.clear = function() {
            colorBuffer.fill(0);
            depthBuffer.fill(1.0);
        };

        this.draw = function(v0, v1, v2) {
            rv0.copy(v0)
            rv1.copy(v1)
            rv2.copy(v2)
            const mask = clipper.computeMask(rv0, rv1, rv2);
            if (mask < 0) return;
            if (mask === 0) {
                rv0.coord.transform(transform);
                rv1.coord.transform(transform);
                rv2.coord.transform(transform);
                this.render(rv0, rv1, rv2);
            } else if (!clipper.clip(rv0, rv1, rv2, mask)) {
                let i = 0;
                rv0.copy(clipper.a[i++]).coord.transform(transform);
                rv2.copy(clipper.a[i++]).coord.transform(transform);
                while (i < clipper.acount) {
                    rv1.copy(rv2);
                    rv2.copy(clipper.a[i++]).coord.transform(transform);
                    this.render(rv0, rv1, rv2);
                }
            }
        };

        this.render = function(v0, v1, v2) {
            gradients.configure(v0, v1, v2)

            let topV;
            let midV;
            let botV;
            let topOneOverZ;
            let midOneOverZ;
            let edgeLeft0 = edge0;
            let edgeLeft1 = edge0;
            let edgeRight0 = edge1;
            let edgeRight1 = edge2;
            if (v0.coord.y < v1.coord.y) {
                if (v2.coord.y < v0.coord.y) {
                    topV = v2;
                    midV = v0;
                    botV = v1;
                    topOneOverZ = gradients.oneOverZ2;
                    midOneOverZ = gradients.oneOverZ0;
                } else {
                    topV = v0;
                    topOneOverZ = gradients.oneOverZ0;
                    if (v1.coord.y < v2.coord.y) {
                        midV = v1;
                        botV = v2;
                        midOneOverZ = gradients.oneOverZ1;
                    } else {
                        midV = v2;
                        botV = v1;
                        midOneOverZ = gradients.oneOverZ2;
                        edgeLeft0 = edge1;
                        edgeLeft1 = edge2;
                        edgeRight0 = edge0;
                        edgeRight1 = edge0;
                    }
                }
            } else {
                if (v2.coord.y < v1.coord.y) {
                    topV = v2;
                    midV = v1;
                    botV = v0;
                    topOneOverZ = gradients.oneOverZ2;
                    midOneOverZ = gradients.oneOverZ1;
                    edgeLeft0 = edge1;
                    edgeLeft1 = edge2;
                    edgeRight0 = edge0;
                    edgeRight1 = edge0;
                } else {
                    topV = v1;
                    topOneOverZ = gradients.oneOverZ1;
                    if (v0.coord.y < v2.coord.y) {
                        midV = v0;
                        botV = v2;
                        midOneOverZ = gradients.oneOverZ0;
                        edgeLeft0 = edge1;
                        edgeLeft1 = edge2;
                        edgeRight0 = edge0;
                        edgeRight1 = edge0;
                    } else {
                        midV = v2;
                        botV = v0;
                        midOneOverZ = gradients.oneOverZ2;
                    }
                }
            }

            edge0.configure(gradients, topV, botV, topOneOverZ);
            if (edge0.height > 0) {
                edge1.configure(gradients, topV, midV, topOneOverZ)
                if (edge1.height > 0) {
                    rasterize(edge1.y, edge1.height, edgeLeft0, edgeRight0);
                }
                edge2.configure(gradients, midV, botV, midOneOverZ)
                if (edge2.height > 0) {
                    rasterize(edge2.y, edge2.height, edgeLeft1, edgeRight1);
                }
            }
        };

        function rasterize(y, height, left, right) {
            let offset = y * surface.width;
            while (height-- > 0) {
                const startX = Math.ceil(left.x - 1.0) | 0;
                const width = (Math.ceil(right.x - 1.0) | 0) - startX;
                const preStepX = startX - left.x;
                let dz = preStepX * gradients.dZdX + left.z;
                let tu = preStepX * gradients.dTudX + left.tu;
                let tv = preStepX * gradients.dTvdX + left.tv;
                let lu = preStepX * gradients.dLudX + left.lu;
                let lv = preStepX * gradients.dLvdX + left.lv;
                let oz = preStepX * gradients.dOneOverZdX + left.oneOverZ;
                let x1 = offset + startX;
                const x2 = x1 + width;
                while (x1++ < x2) {
                    if (dz < depthBuffer[x1]) {
                        depthBuffer[x1] = dz;
                        const overZ = 1.0 / oz;
                        const a = colorMap.sample(tu * overZ, tv * overZ);
                        const b = lightMap.sample(lu * overZ, lv * overZ);
                        const red = clamp((a >>> 0x10 & 0xFF) * (b >>> 0x10 & 0xFF) >>> 7);
                        const grn = clamp((a >>> 0x08 & 0xFF) * (b >>> 0x08 & 0xFF) >>> 7);
                        const blu = clamp((a >>> 0x00 & 0xFF) * (b >>> 0x00 & 0xFF) >>> 7);
                        colorBuffer[x1] = OPAQUE | blu << 16 | grn << 8 | red;
                    }
                    dz += gradients.dZdX;
                    tu += gradients.dTudX;
                    tv += gradients.dTvdX;
                    lu += gradients.dLudX;
                    lv += gradients.dLvdX;
                    oz += gradients.dOneOverZdX;
                }
                offset += surface.width;
                left.x += left.xStep;
                left.z += left.zStep;
                left.tu += left.tuStep;
                left.tv += left.tvStep;
                left.lu += left.luStep;
                left.lv += left.lvStep;
                left.oneOverZ += left.oneOverZStep;
                right.x += right.xStep;
            }
        }
    }
}
