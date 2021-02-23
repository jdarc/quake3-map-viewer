import { Vector } from "./vector";
import { Vertex } from "./vertex";
import { Texture } from "./texture";
import { ByteBuffer } from "./byteBuffer";
import { Quake3Map } from "./quake3Map";

class Q3Header {
    constructor(magic, version) {
        this.magic = magic;
        this.version = version;
    }
}

class Q3Lump {
    constructor(offset, length) {
        this.offset = offset;
        this.length = length;
    }
}

class Q3Texture {
    constructor(buffer) {
        this.name = buffer.readString(64);
        this.flags = buffer.readInt();
        this.contents = buffer.readInt();
    }
}

class Q3Node {
    constructor(buffer) {
        this.planeIndex = buffer.readInt();
        this.frontPlaneIndex = buffer.readInt();
        this.backPlaneIndex = buffer.readInt();
        this.minx = buffer.readInt();
        this.miny = buffer.readInt();
        this.minz = buffer.readInt();
        this.maxx = buffer.readInt();
        this.maxy = buffer.readInt();
        this.maxz = buffer.readInt();
    }
}

class Q3Face {
    constructor(buffer) {
        this.textureID = buffer.readInt();
        this.effect = buffer.readInt();
        this.type = buffer.readInt();
        this.vertexIndex = buffer.readInt();
        this.numOfVerts = buffer.readInt();
        this.faceVertexIndex = buffer.readInt();
        this.numOfFaceIndices = buffer.readInt();
        this.lightmapID = buffer.readInt();
        this.lMapCornerX = buffer.readInt();
        this.lMapCornerY = buffer.readInt();
        this.lMapSizeX = buffer.readInt();
        this.lMapSizeY = buffer.readInt();
        this.lMapPos = new Vector(buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), 1.0).swizzle();
        this.lMapVecs0 = new Vector(buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), 1.0).swizzle();
        this.lMapVecs1 = new Vector(buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), 1.0).swizzle();
        this.normal = new Vector(buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), 1.0).swizzle();
        this.patchWidth = buffer.readInt();
        this.patchHeight = buffer.readInt();
    }
}

class Q3BrushSide {
    constructor(buffer) {
        this.planeIndex = buffer.readInt();
        this.textureIndex = buffer.readInt();
    }
}

class Q3Brush {
    constructor(buffer) {
        this.brushSide = buffer.readInt();
        this.numberOfBrushSides = buffer.readInt();
        this.textureIndex = buffer.readInt();
    }
}

class Q3Leaf {
    constructor(buffer) {
        this.cluster = buffer.readInt();
        this.area = buffer.readInt();
        this.minx = buffer.readInt();
        this.miny = buffer.readInt();
        this.minz = buffer.readInt();
        this.maxx = buffer.readInt();
        this.maxy = buffer.readInt();
        this.maxz = buffer.readInt();
        this.leafFace = buffer.readInt();
        this.numberOfLeafFaces = buffer.readInt();
        this.leafBrush = buffer.readInt();
        this.numberOfLeafBrushes = buffer.readInt();
    }
}

class Q3VisibilityData {
    constructor(buffer) {
        this.nVecs = buffer.readInt();
        this.szVecs = buffer.readInt();
        this.vecs = new Int32Array(this.nVecs * this.szVecs);
        buffer.readBlock(this.vecs, 0, this.vecs.length);
    }

    isClusterVisible(visCluster, testCluster) {
        if (visCluster < 0) return true;
        return (this.vecs[(visCluster * this.szVecs + (testCluster >> 3))] & 1 << (testCluster & 7)) !== 0;
    }
}

class Q3LightMap {
    constructor(buffer) {
        this.data = new Int32Array(49152);
        buffer.readBlock(this.data, 0, this.data.length);
    }
}

function readTextures(buffer, lump) {
    const textures = new Array(lump.length / 72);
    for (let i = 0; i < textures.length; i++) {
        buffer.pos(lump.offset + i * 72);
        textures[i] = new Q3Texture(buffer);
    }
    return textures;
}

function readLump(buffer, lumpIndex) {
    buffer.pos(lumpIndex * 8 + 8);
    return new Q3Lump(buffer.readInt(), buffer.readInt());
}

function parseHeader(buffer) {
    return new Q3Header(buffer.readString(4), buffer.readInt());
}

function readNodes(buffer, lump) {
    const nodes = new Array(lump.length / 36);
    for (let i = 0; i < nodes.length; i++) {
        nodes[i] = new Q3Node(buffer.pos(lump.offset + i * 36));
    }
    return nodes;
}

function readPlanes(buffer, lump) {
    const planes = new Array(lump.length / 16);
    for (let i = 0; i < planes.length; i++) {
        buffer.pos(lump.offset + i * 16);
        const normal = new Vector(buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), 1).swizzle();
        planes[i] = new Vector(normal.x, normal.y, normal.z, buffer.readFloat());
    }
    return planes;
}

function readLeafFaces(buffer, lump) {
    const leafFaces = new Array(lump.length / 4);
    buffer.pos(lump.offset);
    for (let i = 0; i < leafFaces.length; i++) {
        leafFaces[i] = buffer.readInt();
    }
    return leafFaces;
}

function readLeaves(buffer, lump) {
    const leaves = new Array(lump.length / 48);
    for (let i = 0; i < leaves.length; i++) {
        leaves[i] = new Q3Leaf(buffer.pos(lump.offset + i * 48));
    }
    return leaves;
}

function readBrushSides(buffer, lump) {
    const brushSides = new Array(lump.length / 8);
    for (let i = 0; i < brushSides.length; i++) {
        buffer.pos(lump.offset + i * 8);
        brushSides[i] = new Q3BrushSide(buffer);
    }
    return brushSides;
}

function readBrushes(buffer, lump) {
    const brushes = new Array(lump.length / 12);
    for (let i = 0; i < brushes.length; i++) {
        buffer.pos(lump.offset + i * 12);
        brushes[i] = new Q3Brush(buffer);
    }
    return brushes;
}

function readLeafBrushes(buffer, lump) {
    const leafBrushes = new Array(lump.length / 4);
    buffer.pos(lump.offset);
    for (let i = 0; i < leafBrushes.length; i++) {
        leafBrushes[i] = buffer.readInt();
    }
    return leafBrushes;
}

function readFaces(buffer, lump) {
    const faces = new Array(lump.length / 104);
    for (let i = 0; i < faces.length; i++) {
        faces[i] = new Q3Face(buffer.pos(lump.offset + i * 104));
    }
    return faces;
}

function readFaceIndices(buffer, lump) {
    const faceIndices = new Array(lump.length / 4);
    buffer.pos(lump.offset);
    for (let i = 0; i < faceIndices.length; i++) {
        faceIndices[i] = buffer.readInt();
    }
    return faceIndices;
}

function readVertices(buffer, lump) {
    const vertices = new Array(lump.length / 44);
    for (let i = 0; i < vertices.length; i++) {
        buffer.pos(lump.offset + i * 44);
        const vertex = vertices[i] = new Vertex();
        vertex.coord.set(buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), 1.0).swizzle();
        vertex.texel.set(buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), buffer.readFloat());
    }
    return vertices;
}

function readVisData(buffer, lump) {
    return new Q3VisibilityData(buffer.pos(lump.offset));
}

function readLightMaps(buffer, lump) {
    const lightMaps = new Array(lump.length / 49152);
    for (let i = 0; i < lightMaps.length; i++) {
        lightMaps[i] = new Q3LightMap(buffer.pos(lump.offset + i * 49152));
    }
    return lightMaps;
}

function loadTextures(textures) {
    const textureMaps = new Array(textures.length);
    for (let i = 0; i < textures.length; i++) {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            textureMaps[i] = new Texture(canvas.width, pixels);
        };
        image.src = `data/${textures[i].name}.jpg`;
    }
    return textureMaps;
}

export class Quake3MapLoader {
    load(path, cb) {
        fetch(`data/${path}`).then(response => response.arrayBuffer()).then((data) => {

            const buffer = new ByteBuffer(new Uint8ClampedArray(data));
            parseHeader(buffer);
            const lumps = new Array(17);
            for (let i = 0; i < lumps.length; i++) {
                lumps[i] = readLump(buffer, i);
            }
            const q3Textures = readTextures(buffer, lumps[1]);
            const textures = loadTextures(q3Textures);
            const planes = readPlanes(buffer, lumps[2]);
            const nodes = readNodes(buffer, lumps[3]);
            const leaves = readLeaves(buffer, lumps[4]);
            const leafFaces = readLeafFaces(buffer, lumps[5]);
            const leafBrushes = readLeafBrushes(buffer, lumps[6]);
            const brushes = readBrushes(buffer, lumps[8]);
            const brushSides = readBrushSides(buffer, lumps[9]);
            const vertices = readVertices(buffer, lumps[10]);
            const faceIndices = readFaceIndices(buffer, lumps[11]);
            const faces = readFaces(buffer, lumps[13]);
            const lightMaps = readLightMaps(buffer, lumps[14]);
            const visibility = readVisData(buffer, lumps[16]);
            cb(new Quake3Map(q3Textures, textures, planes, nodes, leaves, leafFaces, leafBrushes, brushes, brushSides, vertices, faceIndices, faces, lightMaps, visibility));
        });
    }
}
