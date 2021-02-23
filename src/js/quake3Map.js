import { Vector } from "./vector";
import { Vertex } from "./vertex";
import { Quake3MapCollider } from "./quake3MapCollider";
import { Texture } from "./texture";

const DEFAULT_COLOR_MAP = new function() {
    this.sample = (u, v) => {
        const i = (u * 8.0 | 0) + (v * 8.0 | 0) & 1
        return i * 0xFF | (1 - i) * 0x7F;
    };
};

const DEFAULT_LIGHT_MAP = new function() {
    this.sample = () => 0xFFFFFFFF;
};

function generateLightMapTextures(lightMaps) {
    const rescale = (c, scale) => c > 1.0 && 1.0 / c < scale ? 1.0 / c : scale;
    const gamma = 2.7 / 255.0;
    const textures = new Array(lightMaps.length);
    for (let i = 0; i < lightMaps.length; i++) {
        const src = lightMaps[i].data;
        const dst = new Uint8ClampedArray(128 * 128 * 4);
        for (let i = 0, len = 128 * 128; i < len; i++) {
            const r = gamma * (0xFF & src[i * 3 + 0]);
            const g = gamma * (0xFF & src[i * 3 + 1]);
            const b = gamma * (0xFF & src[i * 3 + 2]);
            const scale = rescale(b, rescale(g, rescale(r, 1.0))) * 255.0;
            dst[i * 4 + 0] = r * scale & 0xFF
            dst[i * 4 + 1] = g * scale & 0xFF
            dst[i * 4 + 2] = b * scale & 0xFF
            dst[i * 4 + 3] = 0xFF
        }

        textures[i] = new Texture(128, dst);
    }
    return textures;
}

export class Quake3Map {

    constructor(q3Textures, colorMapTextures, planes, nodes, leaves, leafFaces, leafBrushes, brushes, brushSides, vertices, faceIndices, faces, lightMaps, visibilityData) {
        const tesselationDegree = 6;
        const oneOverTesselationDegree = 1.0 / tesselationDegree;
        const facesTicks = new Int32Array(faces.length);
        const lightMapTextures = generateLightMapTextures(lightMaps);
        let faceInc = 0;
        let renderer;
        let visibleLeaf;
        const cameraPosition = new Vector();
        const temp0 = new Vertex();
        const temp1 = new Vertex();
        const temp2 = new Vertex();
        const colDetect = new Quake3MapCollider(nodes, planes, leaves, leafBrushes, brushes, brushSides, q3Textures);

        const tessellatedVertices = new Array(tesselationDegree + 1);
        for (let i = 0; i <= tesselationDegree; i++) {
            tessellatedVertices[i] = new Array(tesselationDegree + 1);
            for (let s = 0; s <= tesselationDegree; s++) {
                tessellatedVertices[i][s] = new Vertex();
            }
        }

        this.traceSphere = function(start, end, radius) {
            return colDetect.traceSphere(start, end, radius);
        };

        this.drawMap = function(viz, camPos) {
            faceInc++;
            renderer = viz;
            cameraPosition.set(camPos.x, camPos.y, camPos.z, camPos.w);

            let node;
            let index = 0;
            while (index >= 0) {
                node = nodes[index];
                index = planes[node.planeIndex].side(camPos) < 0 ? node.backPlaneIndex : node.frontPlaneIndex;
            }
            visibleLeaf = leaves[(-index - 1)];

            processLeaf(0);
        };

        function processLeaf(index) {
            if (index < 0) {
                drawLeaf(leaves[-index]);
            } else {
                const node = nodes[index];
                if (planes[node.planeIndex].side(cameraPosition) >= 0) {
                    processLeaf(node.frontPlaneIndex);
                    processLeaf(node.backPlaneIndex);
                } else {
                    processLeaf(node.backPlaneIndex);
                    processLeaf(node.frontPlaneIndex);
                }
            }
        }

        function drawLeaf(leaf) {
            if (visibilityData.isClusterVisible(visibleLeaf.cluster, leaf.cluster)) {
                let numberOfLeafFaces = leaf.numberOfLeafFaces;
                while (numberOfLeafFaces-- > 0) {
                    const faceIndex = leafFaces[leaf.leafFace + numberOfLeafFaces];
                    if (facesTicks[faceIndex] < faceInc) {
                        facesTicks[faceIndex] = faceInc;
                        const face = faces[faceIndex];
                        renderer.useColorMap(colorMapTextures[face.textureID] || DEFAULT_COLOR_MAP);
                        renderer.useLightMap(lightMapTextures[face.lightmapID] || DEFAULT_LIGHT_MAP);
                        if (face.type & 0x1) {
                            let x = 0;
                            while (x < face.numOfFaceIndices) {
                                const v0 = vertices[face.vertexIndex + faceIndices[face.faceVertexIndex + x++]];
                                const v1 = vertices[face.vertexIndex + faceIndices[face.faceVertexIndex + x++]];
                                const v2 = vertices[face.vertexIndex + faceIndices[face.faceVertexIndex + x++]];
                                renderer.draw(v0, v1, v2);
                            }
                        } else if (face.type === 0x2) {
                            const numOfPatchesWide = face.patchWidth - 1 >> 1;
                            const numOfPatchesHigh = face.patchHeight - 1 >> 1;
                            for (let y = 0; y < numOfPatchesHigh; y++) {
                                for (let x = 0; x < numOfPatchesWide; x++) {
                                    const patch = tessellatePatch(y, x, face.patchWidth, face.vertexIndex);
                                    for (let row = 1; row < patch.length; row++) {
                                        const maCol = patch[row].length - 1;
                                        for (let col = 0; col < maCol; col++) {
                                            renderer.draw(patch[row - 1][col], patch[row][col], patch[row - 1][col + 1]);
                                            renderer.draw(patch[row - 1][col + 1], patch[row][col], patch[row][col + 1]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        function tessellatePatch(y, x, patchWidth, vertexIndex) {
            const offset = vertexIndex + (y * patchWidth << 1) + (x << 1);
            const controlPoint0 = vertices[offset];
            const controlPoint1 = vertices[offset + 1];
            const controlPoint2 = vertices[offset + 2];
            const controlPoint3 = vertices[offset + patchWidth];
            const controlPoint4 = vertices[offset + patchWidth + 1];
            const controlPoint5 = vertices[offset + patchWidth + 2];
            const controlPoint6 = vertices[offset + (patchWidth << 1)];
            const controlPoint7 = vertices[offset + (patchWidth << 1) + 1];
            const controlPoint8 = vertices[offset + (patchWidth << 1) + 2];
            let px = 0;
            for (let u = 0; u <= tesselationDegree; u++) {
                bezierCurve(temp0, controlPoint0, controlPoint1, controlPoint2, px);
                bezierCurve(temp1, controlPoint3, controlPoint4, controlPoint5, px);
                bezierCurve(temp2, controlPoint6, controlPoint7, controlPoint8, px);
                let pv = 0;
                for (let v = 0; v <= tesselationDegree; v++) {
                    bezierCurve(tessellatedVertices[v][u], temp0, temp1, temp2, pv);
                    pv += oneOverTesselationDegree;
                }
                px += oneOverTesselationDegree;
            }
            return tessellatedVertices;
        }

        function bezierCurve(target, c0, c1, c2, t) {
            const a = t * t;
            const b = t + t - a - a;
            const c = 1.0 - t - t + a;
            target.coord.x = c2.coord.x * a + c1.coord.x * b + c0.coord.x * c;
            target.coord.y = c2.coord.y * a + c1.coord.y * b + c0.coord.y * c;
            target.coord.z = c2.coord.z * a + c1.coord.z * b + c0.coord.z * c;
            target.texel.x = c2.texel.x * a + c1.texel.x * b + c0.texel.x * c;
            target.texel.y = c2.texel.y * a + c1.texel.y * b + c0.texel.y * c;
            target.texel.z = c2.texel.z * a + c1.texel.z * b + c0.texel.z * c;
            target.texel.w = c2.texel.w * a + c1.texel.w * b + c0.texel.w * c;
        }
    }
}
