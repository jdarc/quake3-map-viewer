function convert(pixels) {
    const data = new Uint32Array(pixels.length >> 2);
    for (let j = 0, len = pixels.length; j < len;) {
        data[j >> 2] = pixels[j++] << 16 | pixels[j++] << 8 | pixels[j++] | pixels[j++] << 24;
    }
    return data;
}

export class Texture {
    constructor(size, pixels) {
        this.size = size | 0;
        this.mask = this.size * this.size - 1;
        this.shift = Math.log2(size) | 0;
        this.data = convert(pixels);
    }

    sample(u, v) {
        const u8 = 256.0 * (u * this.size - 0.5) | 0;
        const v8 = 256.0 * (v * this.size - 0.5) | 0;
        const sx = (0xFF & u8 >>> 8);
        const sy = (0xFF & v8 >>> 8) << this.shift;
        const ex = sx + 1;
        const ey = sy + this.size;
        const a = this.data[this.mask & (sy | sx)];
        const b = this.data[this.mask & (sy | ex)];
        const c = this.data[this.mask & (ey | sx)];
        const d = this.data[this.mask & (ey | ex)];
        const tu = 0xFF & u8
        const tv = 0xFF & v8
        const w1 = (256 - tu) * (256 - tv) >>> 8;
        const w2 = tu * tv >>> 8;
        const w3 = tu - w2;
        const w4 = tv - w2;
        const rb = (a & 0xFF00FF) * w1 + (b & 0xFF00FF) * w3 + (c & 0xFF00FF) * w4 + (d & 0xFF00FF) * w2;
        const ag = (a & 0x00FF00) * w1 + (b & 0x00FF00) * w3 + (c & 0x00FF00) * w4 + (d & 0x00FF00) * w2;
        return (rb & 0xFF00FF00 | ag & 0x00FF0000) >>> 8;
    }
}
